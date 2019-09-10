'use strict';

const events = require('events');
const ApiHelper = require('../api-helper');
const Dictionary = require('../dictionary');
const AwsDistributor = require('../distributors/aws-distributor');
const LocalDistributor = require('../distributors/local-distributor');

/**
 * @abstract Class
 */
class Distributor {
  /**
   * @param {Object} command
   */
  constructor(command) {
    this._eventEmitter = new events.EventEmitter();
    this._workCounter = 0;

    this.command = command;
    this.runId = command._runId;
    this.logger = command.logger;
    this.parameters = command.parameters;
    this.parameters.isCloud = false;
    this.tokenIsValid = command._tokenIsValid || false;
  }

  /**
   * @return {Promise}
   */
  async run() {
    await this.command.validate();
    await this.sendLogsToApi();

    const result = await this.command.run();

    if (!Array.isArray(result)) {
      return Promise.resolve(result);
    }

    try {
      const [{ actions, config, postActionFn, ...options }] = result;

      if (config) {
        this.projectConfig = config;
      }

      // console.log('runactions  step :', { actions, config, postActionFn, options });
      // eslint-disable-next-line no-await-in-loop
      const response = await this.runActions(actions, config, this.parameters, options);

      if (postActionFn) {
        return postActionFn(response);
      }
      // }
    } catch (err) {
      return Promise.reject(err.message || err);
    }

    await ApiHelper.sendMainWorkflow({ status: 'update' });

    return Promise.resolve('Done');
  }

  /**
   * @param {Number} direction
   * @return {Object}
   * @protected
   */
  buildDependencyTable(direction) {
    const keys = Object.keys(this.projectConfig);

    const result = keys.reduce((acc, key) => {
      acc[key] = {};

      return acc;
    }, {});

    switch (direction) {
      case Dictionary.DIRECTION.FORWARD:
        keys.forEach(key => {
          Object.assign(result[key], this.projectConfig[key].dependsOn);
        });
        break;

      case Dictionary.DIRECTION.REVERSE:
        keys.forEach(key => {
          Object.keys(this.projectConfig[key].dependsOn).forEach(hash => {
            result[hash][key] = null;
          });
        });
        break;
    }

    return result;
  }

  /**
   * Remove dependencies on this component
   * @param {Object} dependencyTable
   * @param {String} hash
   * @protected
   */
  removeDependencies(dependencyTable, hash) {
    Object.keys(dependencyTable).forEach(key => {
      delete dependencyTable[key][hash];
    });
  }

  /**
   * @param {String[]} actions
   * @param {Object} config
   * @param {Object} parameters
   * @param {Object} options
   * @return {Promise}
   * @abstract
   */
  async runActions(actions, config, parameters, {
    format = '',
    planDestroy = false,
    dependencyDirection = null,
    resourceName = '',
    importId = '',
    input = false
  } = {}) {
    const results = [];
    this._env = { format, planDestroy, resourceName, importId, input };
    this._dependencyTable = this.buildDependencyTable(dependencyDirection);
    this.TERRAFORM_ACTIONS = actions;

    return new Promise((resolve, reject) => {
      this.distributeConfig();

      this._eventEmitter.on('message', (data) => {
        const { data: response } = data;

        if (response.isError) {
          this._error = response.error;
          return;
        }

        if (response && !results.some(it => it.id === response.id)) {
          results.push(response);
        }

        this.removeDependencies(this._dependencyTable, response.hash);
      });

      this._eventEmitter.on('exit', (data) => {
        const { code, isError, message } = data;
        this._workCounter--;

        if (code === 0) {
          this.distributeConfig();
        }

        if (isError) {
          this._error = message;
        }

        const hashes = Object.keys(this._dependencyTable);

        if (!hashes.length && !this._workCounter) {
          if (this._error) {
            return reject(this._error);
          } else {
            return resolve(results);
          }
        }
      });
    });
  }

  /**
   * Distribute component config to Distributor execution
   */
  distributeConfig() {
    const hashes = Object.keys(this._dependencyTable);

    for (let index = 0; index < hashes.length; index++) {
      const hash = hashes[index];
      const dependsOn = Object.keys(this._dependencyTable[hash]);

      if (!dependsOn.length) {
        this.getDistributor(hash).distribute({ actions: this.TERRAFORM_ACTIONS, runId: this.runId });

        this._workCounter++;

        delete this._dependencyTable[hash];
      }
    }
  }

  /**
   * @param {String} hash
   * @return {LocalDistributor|AwsDistributor}
   */
  getDistributor(hash) {
    const config = this.projectConfig[hash];
    const { distributor } = config;

    switch (distributor) {
      case 'local':
        this.distributor = new LocalDistributor(this.parameters, config, this._env, this._eventEmitter);
        break;
      case 'lambda':
        this.distributor = new AwsDistributor(this.parameters, config, this._env, this._eventEmitter);
        break;
      case 'fargate':
        this.distributor = new AwsDistributor(this.parameters, config, this._env, this._eventEmitter);
        break;
      default:
        this.distributor = new LocalDistributor(this.parameters, config, this._env, this._eventEmitter);
        break;
    }

    return this.distributor;
  }

  /**
   * @return {Promise}
   */
  async sendLogsToApi() {
    ApiHelper.setToken(this.command._tokenIsValid);

    const environment = this.command.getOption('env') ? this.command.getOption('env') : 'default';
    const projectConfig = this.command.getProjectConfig();

    return ApiHelper.sendMainWorkflow({
      status: 'create',
      runId: this.command.runId,
      commandName: this.command._name,
      project: projectConfig,
      environment: environment
    });
  }
}

module.exports = Distributor;
