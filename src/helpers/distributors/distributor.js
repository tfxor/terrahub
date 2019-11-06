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
    this._eventEmitter = new events.EventEmitter();
    this._workCounter = 0;
    this._localWorkerCounter = 0;
    this._lambdaWorkerCounter = 0;
    this.errors = [];

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
    if (this.command._tokenIsValid) { //todo init WS only if exist lambda distributor
      await this._lambdaSubscribe();
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
    // const errors = [];
    this._env = { format, planDestroy, resourceName, importId, importLines, stateList, stateDelete, input };
    this._dependencyTable = this.buildDependencyTable(dependencyDirection);
    this.TERRAFORM_ACTIONS = actions;

    return new Promise((resolve, reject) => {
      this.distributeConfig();

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

      this._eventEmitter.on('exit', (data) => {
        const { code, worker } = data;
        this._workCounter--;

        worker === 'lambda' ? this._lambdaWorkerCounter-- : this._localWorkerCounter--;

        if (code === 0 && !this.errors.length) {
          this.distributeConfig();
        }

        const hashes = Object.keys(this._dependencyTable);
        console.log({
          hashes: hashes.length,
          workers: this._workCounter,
          lambda: this._lambdaWorkerCounter,
          local: this._localWorkerCounter,
          errors: this.errors.length
        });
        if (!hashes.length && !this._workCounter && !this.errors.length) { return resolve(results); }
        if (this.errors.length && !this._workCounter) { return reject(this.errors); }
      });
    });
  }

  /**
   * Distribute component config to Distributor execution
   * @return {void}
   */
  distributeConfig() {
    const hashes = Object.keys(this._dependencyTable);
    for (let index = 0; index < hashes.length && this._localWorkerCounter < this._threadsCount; index++) {
      const hash = hashes[index];
      const dependsOn = Object.keys(this._dependencyTable[hash]);

      if (!dependsOn.length) {
        // try {
        this.distributor = this.getDistributor(hash);// //todo remove from lambdaWorkerCount (maybe make error hanlder that sends' error to EventEmitter)

        if (this.distributor instanceof AwsDistributor) {
          this.distributor.distribute({ actions: this.TERRAFORM_ACTIONS, runId: this.runId }).catch(err => {
            console.log('distributor.distribute error :', err);
            this._workCounter--;
            this._lambdaWorkerCounter--;
            this._eventEmitter.emit('message',
              { ...{ worker: 'lambda' }, ...err });
            this._eventEmitter.emit('exit', { worker: 'lambda', code: 1 });

            this.errors.push(err.message);
          });
        } else {
          this.distributor.distribute({ actions: this.TERRAFORM_ACTIONS, runId: this.runId });
        }

        this._workCounter++;
        delete this._dependencyTable[hash];
        // } catch (err) {
        //   console.log('catched in distribuot.distributeConfig :', err);
        //   return this.logger.error(err); //todo it's async distribute that is calling sync ...
        // }

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
        this._localWorkerCounter++;
        return LocalDistributor.init(
          this.parameters, config, this._env, (event, message) => this._eventEmitter.emit(event, message));
      case 'lambda':
        this._lambdaWorkerCounter++;
        return new AwsDistributor(this.parameters, config, this._env);
      case 'fargate':
        return new AwsDistributor(this.parameters, config, this._env);
      default:
        return LocalDistributor.init(
          this.parameters, config, this._env, (event, message) => this._eventEmitter.emit(event, message));
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
