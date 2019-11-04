'use strict';

const events = require('events');
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
    await this.initWebSocket(); //todo init WS only if exist lambda distributor

    const result = await this.command.run();

    if (!Array.isArray(result)) {
      return Promise.resolve(result);
    }

    try {
      // for (const step of result) {
      const [{ actions, config, postActionFn, ...options }] = result;

      if (config) {
        this.projectConfig = config;
      }

      // eslint-disable-next-line no-await-in-loop
      const response = await this.runActions(actions, config, this.parameters, options);

      if (postActionFn) {
        return postActionFn(response);
      }
      // }
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
    const errors = [];
    this._env = { format, planDestroy, resourceName, importId, importLines, stateList, stateDelete, input };
    this._dependencyTable = this.buildDependencyTable(dependencyDirection);
    this.TERRAFORM_ACTIONS = actions;

    return new Promise((resolve, reject) => {
      this.distributeConfig();

      this._eventEmitter.on('message', (data) => {
        const response = data.data || data;

        if (response.isError) {
          errors.push(response.error || response.message); //TODO lambda ...
          return;
        }

        if (response && !results.some(it => it.id === response.id)) {
          results.push(response);
        }

        this.removeDependencies(this._dependencyTable, response.hash);
      });

      this._eventEmitter.on('exit', (data) => {
        const { code, worker } = data;
        this._workCounter--;

        worker === 'lambda' ? this._lambdaWorkerCounter-- : this._localWorkerCounter--;

        if (code === 0) {
          this.distributeConfig();
        }

        const hashes = Object.keys(this._dependencyTable);

        if (!hashes.length && !this._workCounter && !errors.length) { return resolve(results); }
        if (errors.length && !this._workCounter) { return reject(errors); }
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
        try {
          this.distributor = this.getDistributor(hash);
          this.distributor.distribute({ actions: this.TERRAFORM_ACTIONS, runId: this.runId });
        } catch (err) {
          return this.logger.error(err);
        }

        this._workCounter++; // todo ???
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
        this._localWorkerCounter++;
        return LocalDistributor.init(
          this.parameters, config, this._env, (event, message) => this._eventEmitter.emit(event, message));
      case 'lambda':
        this._lambdaWorkerCounter++;
        return new AwsDistributor(
          this.parameters, config, this._env,
          (event, message) => this._eventEmitter.emit(event, message),
          this.webSocket);
      case 'fargate':
        return new AwsDistributor(
          this.parameters, config, this._env,
          (event, message) => this._eventEmitter.emit(event, message),
          this.webSocket);
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
   * lazy initialize WebSocket
   * @return {Promise<WebSocket>}
   */
  async initWebSocket() {
    if (!this.webSocket) {
      const { data: { ticket_id } } = await this.websocketTicketCreate();
      const { ws } = new WebSocket(this.parameters.config.api, ticket_id);

      this.webSocket = ws;
    }
    return Promise.resolve();
  }
}

module.exports = Distributor;
