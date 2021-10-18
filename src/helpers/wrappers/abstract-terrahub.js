'use strict';

const path = require('path');
const Fetch = require('../fetch');
const logger = require('../logger');
const Metadata = require('../metadata');
const Terraform = require('./terraform');
const Sentinel = require('./sentinel');
const ApiHelper = require('../api-helper');
const Dictionary = require('../dictionary');
const ConfigLoader = require('../../config-loader');
const { promiseSeries, spawner, exponentialBackoff } = require('../util');

class AbstractTerrahub {
  /**
   * @param {Object} cfg
   * @param {String} thubRunId
   * @param {Object} parameters
   */
  constructor(cfg, thubRunId, parameters) {
    this._runId = thubRunId;
    this._action = '';
    this.parameters = parameters;
    this.parameters.fetch = new Fetch(parameters.fetch.baseUrl, parameters.fetch.authorization);
    this._config = cfg;
    this._project = cfg.project;
    this._terraform = new Terraform(cfg, this.parameters);
    this._metadata = new Metadata(cfg, this.parameters);
    this._timestamp = Math.floor(Date.now() / 1000).toString();
    this._componentHash = ConfigLoader.buildComponentHash(this._config.root);
  }

  /**
   * @param {Object} data
   * @param {Error|String} err
   * @return {Promise}
   * @protected
   * @abstract
   */
  on(data, err = null) {
    throw new Error(`Implement 'on' method...`);
  }

  /**
   * Compose terrahub task
   * @param {String} action
   * @param {Object} options
   * @return {Promise}
   */
  getTask(action, options) {
    this._action = action;
    this._workflowOptions = {
      status: 'create',
      target: 'component',
      name: this._config.name,
      hash: this._config.hash,
      action: this._action
    };


    return Promise.resolve().then(() => {
      if (!['init', 'workspaceSelect', 'plan', 'apply', 'destroy'].includes(this._action)) {
        return this._runTerraformCommand(action).catch(err => console.log(err.message || err));
      }

      if (options.skip) {
        return this.on({ status: Dictionary.REALTIME.SKIP })
          .then(res => this._sendLogsToApi('update', res))
          .then(res => {
            logger.warn(`Action '${this._action}' for '${this._config.name}' was skipped due to ` +
              `'No changes. Infrastructure is up-to-date.'`);

            return res;
          });
      } else {
        return this._getTask();
      }
    }).then(data => {
      const action = this._action;
      const component = this._config.name;

      return { ...data, action, component };
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
    const promises = [];
    if (this._config.hasOwnProperty('hook') &&
      this._config.hook.hasOwnProperty(this._action) &&
      this._config.hook[this._action].hasOwnProperty('sentinel')) {
      promises.push(Sentinel.run(
        this._config,
        this._action,
        hook,
        this._metadata.getObjectPath()
      ));
    }

    return Promise.all(promises).then(() => {
      let hookPath;
      if (this._config.hasOwnProperty('hook') &&
        this._config.hook.hasOwnProperty(this._action) &&
        this._config.hook[this._action].hasOwnProperty(hook) &&
        this._config.hook[this._action][hook]) {
        hookPath = this._config.hook[this._action][hook];
      } else {
        return Promise.resolve(res);
      }

      if (this._config && this._config.hook.env) {
        Object.assign(process.env, this._config.hook.env.variables);
      }

      const commandsList = Array.isArray(hookPath) ? hookPath : [hookPath];

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
      })).catch(error => {
        let originalMessage;

        ['message', 'stderr'].find(key => {
          if (!error[key]) {
            return false;
          }

          const trimmed = error[key].toString().trim();
          if (!trimmed) {
            return false;
          }

          originalMessage = trimmed;
          return true;
        });

        const message = this._addNameToMessage(originalMessage ?
          `An error occurred in hook ${this._action} ${hook} execution: ${originalMessage}` :
          `An unknown error occurred in hook ${this._action} ${hook} execution.`);

        throw new Error({ ...error, message });
      });
      
    });
  }

  /**
   * @param {String} command
   * @return {Promise}
   * @private
   */
  _runTerraformCommand(command) {
    return exponentialBackoff(() => this._terraform[command](), {
      conditionFunction: error => {
        return [/timeout/, /failed to decode/, /failed to query/, /unable to verify/,
          /could not load plugin/, /unrecognized remote plugin/, /rpc error/,
          /connection reset/, /connection refused/, /connection issue/,
          /ECONNREFUSED/, /ECONNRESET/, /EOF/].some(it => it.test(error.message));
      },
      maxRetries: this.parameters.config.retryCount,
      intermediateAction: (retries, maxRetries) => {
        logger.warn(this._addNameToMessage(`'terraform ${this._action}' failed. ` +
          `Retrying attempt ${retries} out of ${maxRetries} using exponential backoff approach...`));
      },
      component: this._config.name
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
      {
        cwd: path.join(this._config.project.root, this._config.root),
        shell: true,
        ...options
      },
      err => logger.error(this._addNameToMessage(err.toString())),
      data => logger.raw(this._addNameToMessage(data.toString()))
    );
  }

  /**
   * @return {Promise}
   * @protected
   * @abstract
   */
  checkProject() {
    throw new Error(`Implement 'checkProject' method...`);
  }

  /**
   * Get set of actions
   * @return {Promise}
   * @private
   */
  _getTask() {
    return this.checkProject()
      .then(() => this.on({ status: Dictionary.REALTIME.START }))
      .then(() => this._sendLogsToApi('create'))
      .then(() => this._hook('before'))
      .then(() => this._runTerraformCommand(this._action))
      .then(data => this.upload(data))
      .then(res => this._sendLogsToApi('update', res))
      .then(res => this._hook('after', res))
      .then(data => this.on(data))
      .catch(err => this.on({ status: Dictionary.REALTIME.ERROR }, err));
  }

  /**
   * @param {Object} data
   * @return {Promise}
   * @protected
   * @abstract
   */
  upload(data) {
    throw new Error(`Implement 'upload' method...`);
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
   * Sends logs to Master Process to execute in separate worker
   * @param {String} status
   * @param {*} args
   * @return {Promise}
   * @private
   */
  async _sendLogsToApi(status, ...args) {
    switch (this._config.distributor) {
      case 'local':
        process.send({ type: 'workflow', workerLogger: true, options: { ...this._workflowOptions, status } });
        break;
      case 'lambda':
        ApiHelper.init(this.parameters, this._config.distributor);
        ApiHelper.sendComponentFlow({ ...this._workflowOptions, status });
        break;
      case 'fargate':
        //todo
        break;
      default:
        process.send({ type: 'workflow', workerLogger: true, options: { ...this._workflowOptions, status } });
        break;
    }

    return Promise.resolve(...args);
  }
}

module.exports = AbstractTerrahub;
