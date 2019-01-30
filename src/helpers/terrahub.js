'use strict';

const path = require('path');
const logger = require('./logger');
const Terraform = require('./terraform');
const Dictionary = require('./dictionary');
const { config, fetch } = require('../parameters');
const { promiseSeries, toMd5, spawner, exponentialBackoff } = require('./util');

class Terrahub {
  /**
   * @param {Object} cfg
   */
  constructor(cfg) {
    this._runId = process.env.THUB_RUN_ID;
    this._action = '';
    this._config = cfg;
    this._project = cfg.project;
    this._terraform = new Terraform(cfg);
    this._timestamp = Math.floor(Date.now() / 1000).toString();
    this._componentHash = toMd5(this._config.root);
  }

  /**
   * @param {Object} data
   * @param {Error|String} err
   * @return {Promise}
   * @private
   */
  _on(data, err = null) {
    let error = null;
    let payload = {
      action: this._action,
      status: data.status,
      projectId: this._project.id,
      componentHash: this._componentHash,
      componentName: this._config.name,
      terraformRunId: this._runId
    };

    if (err) {
      error = err instanceof Error ? err : new Error(err || 'Unknown error');
      payload.error = error.message.trim();
    }

    if (payload.action === 'plan' && data.status === Dictionary.REALTIME.SUCCESS) {
      payload.metadata = data.metadata;
    }

    let actionPromise = !config.token
      ? Promise.resolve()
      : fetch.post('thub/realtime/create', { body: JSON.stringify(payload) });

    return actionPromise.then(() => {
      return payload.hasOwnProperty('error') ? Promise.reject(error) : Promise.resolve(data);
    });
  }

  /**
   * Compose terrahub task
   * @param {String} action
   * @param {Object} options
   * @return {Promise}
   */
  getTask(action, options) {
    this._action = action;

    return Promise.resolve().then(() => {
      if (!['init', 'workspaceSelect', 'plan', 'apply', 'destroy'].includes(this._action)) {
        return this._runTerraformCommand(action).catch(err => console.log(err));
      }

      if (options.skip) {
        return this._on({ status: Dictionary.REALTIME.SKIP })
          .then(res => {
            logger.warn(`Action '${this._action}' for '${this._config.name}' was skipped due to ` +
              `'No changes. Infrastructure is up-to-date.'`);
            return res;
          });
      } else {
        return this._getTask();
      }
    }).then(data => {
      data.action = this._action;
      data.component = this._config.name;

      return data;
    });
  }

  /**
   * Check if custom hook is provided
   * @param {String} hook
   * @param {Object} res
   * @return {Promise}
   * @private
   */
  _hook(hook, res = {}) {
    if (['abort', 'skip'].includes(res.status)) {
      return Promise.resolve(res);
    }

    let hookPath;
    try {
      hookPath = this._config.hook[this._action][hook];
    } catch (error) {
      return Promise.resolve(res);
    }

    if (!hookPath) {
      return Promise.resolve(res);
    }

    if (this._config && this._config.hook.env) {
      Object.assign(process.env, this._config.hook.env.variables);
    }

    const commandsList = hookPath instanceof Array ? hookPath : [hookPath];

    return promiseSeries(commandsList.map(it => {
      const args = it.split(' ');
      const extension = path.extname(args[0]);

      // If the first arg is a script file get its absolute path
      if (extension) {
        args[0] = path.resolve(this._project.root, this._config.root, args[0]);
      }

      logger.warn(this._addNameToMessage(`Executing hook '${it}' ${hook} ${this._action} action.`));
      let command;
      switch (extension) {
        case '.js':
          return () => {
            const promise = require(args[0])(this._config, res.buffer);

            return (promise instanceof Promise ? promise : Promise.resolve()).then(() => Promise.resolve(res));
          };

        case '.sh':
          command = 'bash';
          break;

        default:
          command = args.shift();
          break;
      }

      return () => this._spawn(command, args, { env: process.env }).then(() => Promise.resolve(res));
    }));
  }

  /**
   * @param {String} command
   * @return {Promise}
   * @private
   */
  _runTerraformCommand(command) {
    return exponentialBackoff(() => this._terraform[command](), {
      conditionFunction: error => {
        return [/timeout/, /connection reset by peer/, /failed to decode/, /EOF/].some(it => it.test(error.message));
      },
      maxRetries: config.retryCount,
      intermediateAction: (retries, maxRetries) => {
        logger.warn(this._addNameToMessage(`'${this._action}' failed. ` +
          `Retrying using exponential backoff approach (${retries} out of ${maxRetries}).`));
      }
    });
  }

  /**
   * @param {String} binary
   * @param {String[]} args
   * @param {Object} options
   * @return {Promise}
   * @private
   */
  _spawn(binary, args, options = {}) {
    return spawner(
      binary,
      args,
      Object.assign({
        cwd: path.join(this._config.project.root, this._config.root),
        shell: true
      }, options),
      err => logger.error(this._addNameToMessage(err.toString())),
      data => logger.raw(this._addNameToMessage(data.toString()))
    );
  }

  /**
   * @return {Promise}
   * @private
   */
  _checkProject() {
    if (!config.token) {
      return Promise.resolve();
    }

    const payload = {
      name: this._project.name,
      hash: this._project.code
    };

    return fetch.post('thub/project/create', { body: JSON.stringify(payload) }).then(json => {
      this._project.id = json.data.id;

      return Promise.resolve();
    });
  }

  /**
   * Get set of actions
   * @return {Promise}
   * @private
   */
  _getTask() {
    return this._checkProject()
      .then(() => this._on({ status: Dictionary.REALTIME.START }))
      .then(() => this._hook('before'))
      .then(() => this._runTerraformCommand(this._action))
      .then(data => this._upload(data))
      .then(res => this._hook('after', res))
      .then(data => this._on(data, null))
      .catch(err => this._on({ status: Dictionary.REALTIME.ERROR }, err));
  }

  /**
   * @param {Object} data
   * @return {Promise}
   * @private
   */
  _upload(data) {
    if (!config.token || !data || !data.buffer || !['plan', 'apply', 'destroy'].includes(this._action)) {
      return Promise.resolve(data);
    }

    const key = this._getKey();
    const url = `${Terrahub.METADATA_DOMAIN}/${key}`;

    return this._putObject(url, data.buffer)
      .then(() => this._callParseLambda(key))
      .then(() => Promise.resolve(data));
  }

  /**
   * Get destination key
   * @return {String}
   * @private
   */
  _getKey() {
    const dir = config.api.replace('api', 'public');
    const keyName = `${this._componentHash}-terraform-${this._action}.txt`;

    return `${dir}/${this._timestamp}/${keyName}`;
  }

  /**
   * @param {String} key
   * @return {Promise}
   * @private
   */
  _callParseLambda(key) {
    const url = `thub/resource/parse-${this._action}`;

    const options = {
      body: JSON.stringify({
        key: key,
        projectId: this._project.id,
        thubRunId: this._runId
      })
    };

    const promise = fetch.post(url, options).catch(error => {
      error.message = this._addNameToMessage('Failed to trigger parse function');
      logger.error(error);

      return Promise.resolve();
    });

    return process.env.DEBUG ? promise : Promise.resolve();
  }

  /**
   * Put object via bucket url
   * @param {String} url
   * @param {Buffer} body
   * @return {Promise}
   * @private
   */
  _putObject(url, body) {
    const options = {
      method: 'PUT',
      body: body,
      headers: { 'Content-Type': 'text/plain', 'x-amz-acl': 'bucket-owner-full-control' }
    };

    return fetch.request(url, options);
  }

  /**
   * Add '[component_name] ' prefix to message
   * @param {String} message
   * @return {String}
   */
  _addNameToMessage(message) {
    return `[${this._config.name}] ${message}`;
  }

  /**
   * Metadata bucket associated domain
   * @return {String}
   * @constructor
   */
  static get METADATA_DOMAIN() {
    return 'https://data-lake-terrahub-us-east-1.s3.amazonaws.com';
  }
}

module.exports = Terrahub;
