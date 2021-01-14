'use strict';

const events = require('events');
const logger = require('../logger');
const WebSocket = require('./websocket');
const ApiHelper = require('../api-helper');
const Dictionary = require('../dictionary');
const Prepare = require('../prepare-helper');
const OutputCommand = require('../../commands/output');
const AwsDistributor = require('./aws-distributor');
const { physicalCpuCount, threadsLimitCount } = require('../util');
const LocalDistributor = require('./local-distributor');

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

    this.ws = null;
  }

  /**
   * @return {Promise}
   */
  async run() {
    await this.command.validate();
    await this.sendLogsToApi();
    await this._lambdaSubscribe();
    await this._loadLambdaRequirements();

    const result = await this.command.run();

    if (!Array.isArray(result)) {
      this._closeWsConnections();

      return Promise.resolve(result);
    }

    try {
      for (const step of result) {
        const { actions, config, postActionFn, ...options } = step;

        const hashes = Object.keys(config);
        const terraformVersions = Array.from(new Set(hashes.map(hash => config[hash].terraform.version)));
        const distributors = Array.from(new Set(hashes.map(hash => config[hash].distributor))) || [];

        if (distributors.includes('local')) {
          for (const terraformVersion of terraformVersions) {
            await Prepare.checkTerraformBinary(terraformVersion, 'local');
          }
        }

        if (config) {
          this.projectConfig = config;
        }
        // eslint-disable-next-line no-await-in-loop
        const response = await this.runActions(actions, config, this.parameters, options);
        logger.warn('Run actions finished');

        if (postActionFn) {
          if (this.command instanceof OutputCommand) {
            return postActionFn(response);
          }
          // eslint-disable-next-line no-await-in-loop
          await postActionFn(response);
        }
      }
    } catch (err) {
      return Promise.reject(err);
    }

    await ApiHelper.sendMainWorkflow({ status: 'update' });
    this._closeWsConnections();

    return Promise.resolve('Done');
  }

  /**
   * @param {Number} direction
   * @return {Object}
   * @protected
   */
  buildDependencyTable(direction) {
    this._propagateConfigsByTargets();
    const keys = Object.keys(this.projectConfig);
    const result = keys.reduce((acc, key) => {
      acc[key] = {};

      return acc;
    }, {});

    switch (direction) {
      case Dictionary.DIRECTION.FORWARD:
        keys.forEach((key) => {
          Object.assign(result[key], this.projectConfig[key].dependsOn);
        });
        break;

      case Dictionary.DIRECTION.REVERSE:
        keys.forEach((key) => {
          Object.keys(this.projectConfig[key].dependsOn).forEach((hash) => {
            result[hash][key] = null;
          });
        });
        break;
    }

    return result;
  }

  /**
   * @param {String} importLines
   * @return {Object}
   */
  buildImportDependencyTable(importLines) {
    const table = {};
    const batchLength = JSON.parse(importLines).length;
    const componentHash = Object.keys(this.projectConfig)[0];

    for (let i = 0; i < batchLength; i++) {
      table[`${componentHash}~${i}`] = null;
    }

    return table;
  }

  /**
   * Remove dependencies on this component
   * @param {Object} dependencyTable
   * @param {String} hash
   * @protected
   */
  removeDependencies(dependencyTable, hash) {
    Object.keys(dependencyTable).forEach((key) => {
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
  async runActions(
    actions,
    config,
    parameters,
    {
      format = '',
      planDestroy = false,
      stateList = false,
      dependencyDirection = null,
      stateDelete = '',
      resourceName = '',
      importId = '',
      importLines = '',
      input = false
    } = {}
  ) {
    const results = [];
    this._env = { format, planDestroy, resourceName, importId, importLines, stateList, stateDelete, input };
    this.TERRAFORM_ACTIONS = actions;

    this._eventEmitter.on('message', (response) => {
      const data = response.data || response;
      if (data.isError) {
        this._isErrorIgnoredOption(data.message);

        return;
      }

      if (data && !results.some((it) => it.id === data.id)) {
        results.push(data.data || data);
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
    });

    try {
      if (this.isLambdaImportCommand()) {
        this._dependencyTable = this.buildImportDependencyTable(importLines);
        await this.distributeImportConfig(importLines);
      } else {
        this._dependencyTable = this.buildDependencyTable(dependencyDirection);
        await this.distributeConfig();
      }
    } catch (err) {
      if ([/This feature is not available yet/, /[AWS distributor]/].some((it) => it.test(err))) {
        throw new Error(err);
      }
      this.errors.push(err);
    }

    return new Promise((resolve, reject) => {
      this._eventEmitter.on('exit', async (data) => {
        const hashes = Object.keys(this._dependencyTable);

        if (!hashes.length && !this._workCounter && !this.errors.length) {
          return resolve(results);
        }
        if (this.errors.length && !this._workCounter) {
          return reject(this.errors);
        }
      });
    });
  }

  /**
   * Distribute component config to Distributor execution
   * @return {Promise<void>}
   */
  async distributeConfig() {
    const hashes = Object.keys(this._dependencyTable);
    const promises = [];

    for (let index = 0; index < hashes.length && this._localWorkerCounter < this._threadsCount; index++) {
      const hash = hashes[index];
      const dependsOn = Object.keys(this._dependencyTable[hash]);
      const providerId = this.getImportId(hash);

      if (!dependsOn.length) {
        this.distributor = this.getDistributor(hash, false, providerId);
        if (this.distributor instanceof AwsDistributor) {
          promises.push(
            this.distributor.distribute({
              actions: this.TERRAFORM_ACTIONS,
              runId: this.runId,
              accountId: this.accountId,
              indexCount: index
            })
          );
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
   * @param {Object | boolean} parameters
   * @param {Object | boolean} providerId
   * @return {LocalDistributor|AwsDistributor}
   */
  getDistributor(hash, parameters = false, providerId = false) {
    const config = this.projectConfig[hash];
    const { distributor } = config;

    if (config.project.env) {
      if (config.project.env.variables) {
        Object.assign(this._env, config.project.env.variables);
      }
    }
    if (config.processEnv) {
      Object.assign(this._env, config.processEnv);
    }

    switch (distributor) {
      case 'local':
        this._localWorkerCounter++;
        return LocalDistributor.init(
          this.parameters,
          config,
          this._env,
          (event, message) => this._eventEmitter.emit(event, message)
        );
      case 'lambda':
        this._lambdaWorkerCounter++;
        return new AwsDistributor(
          parameters ? parameters : this.parameters,
          config,
          providerId ? { ...this._env, providerId: providerId } : this._env
        );
      case 'fargate':
        //todo
        throw new Error('[Fargate Distributor]: This feature is not available yet.');
      case 'appEngine':
        //todo
        throw new Error('[AppEngine Distributor]: This feature is not available yet.');
      case 'cloudFunctions':
        //todo
        throw new Error('[CloudFunctions Distributor]: This feature is not available yet.');
      default:
        return LocalDistributor.init(
          this.parameters, config, this._env, (event, message) => this._eventEmitter.emit(event, message));
    }
  }

  /**
   * @param {String} importLines
   * @return {Promise}
   */
  distributeImportConfig(importLines) {
    const hashes = Object.keys(this._dependencyTable);
    const promises = [];
    const isBatch = this.parameters.args.b;

    for (let index = 0; index < hashes.length; index++) {
      const hash = hashes[index].split('~')[0];
      const parameters = this.replaceBatchToSimpleImport(importLines, index, isBatch);

      this.distributor = this.getDistributor(hash, isBatch ? parameters : false);
      if (this.distributor instanceof AwsDistributor) {
        promises.push(
          this.distributor.distribute({
            actions: this.TERRAFORM_ACTIONS,
            runId: this.runId,
            accountId: this.accountId,
            importIndex: index
          })
        );
      }

      this._workCounter++;
      delete this._dependencyTable[hashes[index]];
    }

    if (promises.length) {
      return Promise.all(promises);
    }

    return Promise.resolve();
  }

  /**
   * @param {String} importLines
   * @param {Number} index
   * @param {Boolean} isBatch
   * @return {{}|boolean}
   */
  replaceBatchToSimpleImport(importLines, index, isBatch = false) {
    if (!isBatch) {
      return false;
    }

    let parameters = { ...this.parameters };
    delete parameters.args.b;

    const line = JSON.parse(importLines)[index];
    parameters.args =
      line.provider && line.provider !== ''
        ? { ...parameters.args, ...{ c: { [line.fullAddress]: line.value, j: line.provider } } }
        : { ...parameters.args, ...{ c: { [line.fullAddress]: line.value } } };

    return parameters;
  }

  /**
   * @return {Promise<String>}
   */
  _fetchAccountId() {
    return this.fetch.get('thub/account/retrieve').then((json) => Promise.resolve(json.data.id));
  }

  /**
   * @return {Promise<void>}
   * @private
   */
  async _loadLambdaRequirements() {
    if (this.command._tokenIsValid && !this.accountId) {
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
   * @return {boolean}
   */
  isLambdaImportCommand() {
    const importActions = 'init,workspaceSelect,import';
    const { distributor } = Object.values(this.projectConfig)[0];

    return importActions === this.TERRAFORM_ACTIONS.join(',') && distributor === 'lambda';
  }

  /**
   * @param {String} hash
   * @return {String | boolean}
   */
  getImportId(hash) {
    return hash.includes('_') ? hash.split('_')[1] : false;
  }

  /**
   * Is error ignored option
   * @param {Error} error 
   * @return {void}
   * @private
   */
  _isErrorIgnoredOption(error) {
    if (this.command.getName() === 'run' && this.command.getOption('ignore-missing') === true) {
      if (!/Unable to find remote state/.test(error.message)) {
        this.errors.push(error);
      }
    } else {
      this.errors.push(error);
    }
  }

  /**
   * @return {void}
   * @private
   */
  _propagateConfigsByTargets() {
    Object.keys(this.projectConfig).forEach((hash) => {
      const { distributor } = this.projectConfig[hash];
      const { targets } = this.projectConfig[hash];
      if (distributor === 'lambda' && targets && targets.length) {
        targets.forEach((target, index) => {
          Object.assign(this.projectConfig, { [`${hash}_${index}`]: this.projectConfig[hash] });
        });
        delete this.projectConfig[hash];
      }
    });
  }

  /**
   * subscribe to Lambda websocket
   * @throws Error
   * @return {Promise<void>}
   */
  async _lambdaSubscribe() {
    if (!this.command._tokenIsValid) {
      return Promise.resolve();
    }
    const {
      data: { ticket_id }
    } = await this.websocketTicketCreate();
    this.ws = new WebSocket(this.parameters.config.api, ticket_id).ws;

    this.ws.on('message', (data) => {
      try {
        const parsedData = JSON.parse(data);

        if (parsedData.thubRunId !== this.runId) {
          return ;
        }

        const defaultMessage = { worker: 'lambda' };

        if (parsedData.action === 'logs') {
          parsedData.data.forEach((it) => {
            if (it.action !== 'main' && it.distributor === 'lambda') { logger.log(it.log); }
          });
        }

        if (parsedData.action === 'aws-cloud-deployer') {
          const { data: { isError, hash, message } } = parsedData;

          if (!isError) {
            logger.info(`[${this.projectConfig[hash].name}] Distributed execution was successful.`);

            this._eventEmitter.emit('message', { ...defaultMessage, ...{ isError, message, hash } });
            this._eventEmitter.emit('exit', { ...defaultMessage, ...{ code: 0 } });

          }
          if (isError) {
            this._eventEmitter.emit('message', {
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

  /**
   * Close opened websocket connections
   */
  _closeWsConnections() {
    if (this.ws !== null) {
      if (this.ws.readyState === 0) {
        this.ws.onopen = () => {
          if (this.ws.readyState === 1) {
            this.ws.close(1000, 'Done');
          }
        };
      } else {
        this.ws.close(1000, 'Done');
      }
    }
  }
}

module.exports = Distributor;
