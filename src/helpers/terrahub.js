'use strict';

const path = require('path');
const logger = require('./logger');
const Terraform = require('../helpers/terraform');
const { config, fetch } = require('../parameters');
const { promiseSeries, toMd5, spawner } = require('../helpers/util');

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
   * @param {Object} data
   * @return {Promise}
   * @private
   */
  _on(data, err = null) {
    let error = null;
    let payload = {
      Action: this._action,
      Provider: this._project.provider,
      ProjectHash: this._project.code,
      ProjectName: this._project.name,
      TerraformHash: this._componentHash,
      TerraformName: this._config.name,
      TerraformRunId: this._runId,
      Status: data.status
    };

    if (err) {
      error = new Error(err.message || err);
      payload['Error'] = error.message;
    }
    if (payload.Action === 'plan' && data.status === 'success') {
      payload.Metadata = data.metadata;
    }

    let actionPromise = !config.token
      ? Promise.resolve()
      : fetch.post('thub/realtime/create', { body: JSON.stringify(payload) });

    return actionPromise.then(() => {
      return payload.hasOwnProperty('Error') ? Promise.reject(error) : Promise.resolve(data);
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
        return this._terraform[action]();
      }

      if (options.skip) {
        return this._on({ status: 'skip' })
          .then(res => {
            logger.warn(`Action '${this._action}' for '${this._config.name}' was skipped due to 'No changes. Infrastructure is up-to-date.'`);
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
  _hook(hook, res = null) {
    if (['aborted', 'skip'].includes(res.status)) {
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

    const commandsList = hookPath instanceof Array ? hookPath : [hookPath];

    return promiseSeries(commandsList.map(it => {
      const args = it.split(' ');
      const extension = path.extname(args[0]);

      // If the first arg is a script file get its absolute path
      if (extension) {
        args[0] = path.resolve(this._project.root, this._config.root, args[0]);
      }

      let command;
      switch (extension) {
        case '.js':
          return () => {
            const promise = require(args[0])(this._config, res.buffer);

            return (promise instanceof Promise ?
              promise :
              Promise.resolve()).then(() => Promise.resolve(res));
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
   * @param {String} binary
   * @param {String} filePath
   * @param {Object} options
   * @return {Promise}
   * @private
   */
  _spawn(binary, filePath, options = {}) {
    return spawner(binary, [filePath], Object.assign({
        cwd: path.join(this._config.project.root, this._config.root),
        shell: true
      }, options),
      err => logger.error(`[${this._config.name}] ${err.toString()}`),
      data => logger.raw(`[${this._config.name}] ${data.toString()}`)
    );
  }

  /**
   * Get set of actions
   * @return {Promise}
   * @private
   */
  _getTask() {
    return this._on({ status: 'start' })
      .then(() => this._hook('before', {}))
      .then(() => this._terraform[this._action]())
      .then(data => this._upload(data))
      .then(res => this._hook('after', res))
      .then(data => this._on(data, null))
      .catch(err => this._on({ status: 'error' }, err))
      .catch(err => {
        if (['EAI_AGAIN', 'NetworkingError'].includes(err.code)) {
          err = new Error('Internet connection issue');
        }

        throw err;
      });
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
    const url = `thub/resource/parse-${this._action === 'plan' ? 'plan' : 'state'}`;
    const options = {
      body: JSON.stringify(Object.assign({ Key: key }, this._awsMetadata())),
    };

    fetch.post(url, options).catch(() => logger.error(`[${this._config.name}] Failed to trigger parse function`));

    return Promise.resolve();
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
   * Get AWS metadata
   * @return {Object}
   * @private
   */
  _awsMetadata() {
    return {
      ThubRunId: this._runId,
      ThubAction: this._action,
      ProjectName: this._project.name,
      ProjectCode: this._project.code
    };
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
