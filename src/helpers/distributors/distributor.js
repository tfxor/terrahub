'use strict';

const events = require('events');
const logger = require('../logger');
const WebSocket = require('./websocket');
const ApiHelper = require('../api-helper');
const Dictionary = require('../dictionary');
const AwsDistributor = require('../distributors/aws-distributor');
const LocalDistributor = require('../distributors/local-distributor');
const { physicalCpuCount, threadsLimitCount } = require('../util');

class Distributor {
  /**
   * @param {Object} command
   */
  constructor(command) {
    this.errors = [];
    this._eventEmitter = new events.EventEmitter();
    this._workCounter = 0;
    this._localWorkerCounter = 0;
    this._lambdaWorkerCounter = 0;

    this.command = command;
    this.runId = command._runId;
    this.logger = command.logger;
    this.parameters = command.parameters;
    this.fetch = this.parameters.fetch;
    this._threadsCount = this.parameters.usePhysicalCpu ? physicalCpuCount() : threadsLimitCount(this.parameters);
  }

  /**
   * @return {Promise}
   */
  async run() {
    await this.command.validate();
    await this.sendLogsToApi();
    if (this.command._tokenIsValid) {
      await this._lambdaSubscribe();
      await this._loadLambdaRequirements();
    }

    const result = await this.command.run();

    if (!Array.isArray(result)) {
      return Promise.resolve(result);
    }

    try {
      for (const step of result) {
        const { actions, config, postActionFn, ...options } = step;

        if (config) {
          this.projectConfig = config;
        }
        // eslint-disable-next-line no-await-in-loop
        const response = await this.runActions(actions, config, this.parameters, options);

        if (postActionFn) {
          return postActionFn(response);
        }
      }
    } catch (err) {
      return Promise.reject(err);
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
   * @param {String} format
   * @param {Boolean} planDestroy
   * @param {Boolean} stateList
   * @param {Number} dependencyDirection
   * @param {String} stateDelete
   * @param {String} importLines
   * @param {String} resourceName
   * @param {String} importId
   * @param {Boolean} input
   * @return {Promise}
   */
  async runActions(actions, config, parameters, {
    format = '',
    planDestroy = false,
    stateList = false,
    dependencyDirection = null,
    stateDelete = '',
    resourceName = '',
    importId = '',
    importLines = '',
    input = false
  } = {}) {
    const results = [];
    this._env = { format, planDestroy, resourceName, importId, importLines, stateList, stateDelete, input };
    this._dependencyTable = this.buildDependencyTable(dependencyDirection);
    this.TERRAFORM_ACTIONS = actions;

    try {
      await this.distributeConfig();
    } catch (err) {
      if (/This feature current is not available/.test(err)) { throw new Error(err); }
      this.errors.push(err);
    }

    return new Promise((resolve, reject) => {
      this._eventEmitter.on('message', (response) => {
        const data = response.data || response;
        if (data.isError) {
          this.errors.push(data.message);
          return;
        }

        if (data && !results.some(it => it.id === data.id)) {
          results.push(data);
        }

        this.removeDependencies(this._dependencyTable, data.hash);
      });

      this._eventEmitter.on('exit', async (data) => {
        const { code, worker } = data;
        this._workCounter--;

        worker === 'lambda' ? this._lambdaWorkerCounter-- : this._localWorkerCounter--;

        if (code === 0 && !this.errors.length) {
          await this.distributeConfig();
        }

        const hashes = Object.keys(this._dependencyTable);

        if (!hashes.length && !this._workCounter && !this.errors.length) { return resolve(results); }
        if (this.errors.length && !this._workCounter) { return reject(this.errors); }
      });
    });
  }

  /**
   * Distribute component config to Distributor execution
   * @return {void}
   */
  async distributeConfig() {
    const hashes = Object.keys(this._dependencyTable);
    const promises = [];

    for (let index = 0; index < hashes.length && this._localWorkerCounter < this._threadsCount; index++) {
      const hash = hashes[index];
      const dependsOn = Object.keys(this._dependencyTable[hash]);

      if (!dependsOn.length) {
        this.distributor = this.getDistributor(hash);
        if (this.distributor instanceof AwsDistributor) {
          promises.push(this.distributor.distribute(
            { actions: this.TERRAFORM_ACTIONS, runId: this.runId, accountId: this.accountId }));
        } else {
          this.distributor.distribute({ actions: this.TERRAFORM_ACTIONS, runId: this.runId });
        }

        this._workCounter++;
        delete this._dependencyTable[hash];
      }
    }

    if (promises.length) {
      return Promise.all(promises);
    }

    return Promise.resolve();
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
        this._localWorkerCounter++;
        return LocalDistributor.init(
          this.parameters, config, this._env, (event, message) => this._eventEmitter.emit(event, message));
      case 'lambda':
        this._lambdaWorkerCounter++;
        return new AwsDistributor(this.parameters, config, this._env);
      case 'fargate':
        //todo
        throw new Error('[Fargate Distributor]: This feature current is not available.');
      case 'appEngine':
        //todo
        throw new Error('[AppEngine Distributor]: This feature current is not available.');
      case 'cloudFunctions':
        //todo
        throw new Error('[CloudFunctions Distributor]: This feature current is not available.');
      default:
        return LocalDistributor.init(
          this.parameters, config, this._env, (event, message) => this._eventEmitter.emit(event, message));
    }
  }

  /**
   * @return {Promise<String>}
   */
  _fetchAccountId() {
    return this.fetch.get('thub/account/retrieve').then(json => Promise.resolve(json.data.id));
  }

  /**
   * @return {Promise<void>}
   * @private
   */
  async _loadLambdaRequirements() {
    if (!this.accountId) {
      this.accountId = await this._fetchAccountId();
    }
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

  /**
   * @return {Promise}
   */
  websocketTicketCreate() {
    return this.fetch.get('thub/ticket/create');
  }

  /**
   * subscribe to Lambda websocket
   * @throws Error
   * @return {Promise<void>}
   */
  async _lambdaSubscribe() {
    const { data: { ticket_id } } = await this.websocketTicketCreate();
    const { ws } = new WebSocket(this.parameters.config.api, ticket_id);

    ws.on('message', data => {
      try {
        const parsedData = JSON.parse(data);
        const defaultMessage = { worker: 'lambda' };

        if (parsedData.action === 'logs') {
          parsedData.data.forEach(it => {
            if (it.action !== 'main' && it.distributor === 'lambda') { logger.log(it.log); }
          });
        }

        if (parsedData.action === 'aws-cloud-deployer') {
          const { data: { isError, hash, message } } = parsedData;
          if (!isError) {
            logger.info(`[${this.projectConfig[hash].name}] Successfully deployed!`);

            this._eventEmitter.emit('message', { ...defaultMessage, ...{ isError, message, hash } });
            this._eventEmitter.emit('exit', { ...defaultMessage, ...{ code: 0 } });
          }
          if (isError) {
            this._eventEmitter.emit('message',
              {
                ...defaultMessage,
                ...{ isError, message: `[${this.projectConfig[hash].name}] ${message}`, hash }
              });
            this._eventEmitter.emit('exit', { ...defaultMessage, ...{ code: 1 } });
          }
        }
      } catch (e) {
        throw new Error(e);
      }
    });
  }
}

module.exports = Distributor;
