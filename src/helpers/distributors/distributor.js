'use strict';

const events = require('events');
const logger = require('../logger');
const WebSocket = require('./websocket');
const ApiHelper = require('../api-helper');
const Dictionary = require('../dictionary');
const Prepare = require('../prepare-helper');
const { execSync } = require('child_process');
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
        const converterVersion = Array.from(new Set(hashes.map(hash => config[hash].converter.version)));
        const componentVersion = Array.from(new Set(hashes.map(hash => config[hash].component.version)));
        const distributors = Array.from(new Set(hashes.map(hash => config[hash].distributor))) || [];

        if (distributors.includes('local')) {
          for (const terraformVersion of terraformVersions) {
            await Prepare.checkTerraformBinary(terraformVersion, 'local');
            await Prepare.checkExtraBinary(converterVersion[0], 'converter', 'local');
            await Prepare.checkExtraBinary(componentVersion[0], 'component', 'local');
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
        return this._isErrorIgnoredOption(data.message);
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

  _replaceEnv(listOfValues, value) {
    const regExTfvars = /\$\{+[a-zA-Z0-9_\-]+\}/gm;
    let updatedValue = value;
    const templateStringifyArr = updatedValue.match(regExTfvars);

    if (templateStringifyArr !== null) {
      for (const terrahubVariable of templateStringifyArr) {
        if (updatedValue !== undefined) {
          updatedValue = updatedValue.replace(
            terrahubVariable,
            listOfValues[terrahubVariable.replace(/[\'\{\}\$]/g, '')]
          );
        }
      }
    }
    return updatedValue;
  }

  _replaceEnvs(listOfValues, config) {
    const regExTfvars = /\$\{+[a-zA-Z0-9_\-]+\}/gm;
    let templateStringify = JSON.stringify(config);
    const templateStringifyArr = templateStringify.match(regExTfvars);

    if (templateStringifyArr !== null) {
      for (const terrahubVariable of templateStringifyArr) {
        templateStringify = templateStringify.replace(
          terrahubVariable,
          listOfValues[
            terrahubVariable.replace(/[\'\{\}\$]/g, '')
          ]
        );
      }
    }
    const replacedConfig = JSON.parse(templateStringify);
    return replacedConfig;
  }

  /**
   * @param {String} hash
   * @param {Object | boolean} parameters
   * @param {Object | boolean} providerId
   * @return {LocalDistributor|AwsDistributor}
   */
  getDistributor(hash, parameters = false, providerId = false) {
    let config = this.projectConfig[hash];
    const { distributor } = config;

    const defaultProcessEnv = {
      TERRAHUB_COMPONENT_HOME: config.fullPath.replace('/.terrahub.yml', '')
    };

    if (
      config.hasOwnProperty('build')
      && config.build.hasOwnProperty('env')
      && config.build.env.hasOwnProperty('variables')) {
      config.build.env.variables = {
        ...defaultProcessEnv,
        ...config.build.env.variables
      };}

    if (config.build && config.build.env && config.build.env.variables) {
      Object.entries(config.build.env.variables)
        .filter((element) => element[1] !== '' && typeof element[1] === 'string')
        .forEach((element) => {
          element[1] = this._replaceEnv(config.build.env.variables, element[1]);
          const stdout = execSync(`echo "${element[1]}"`);
          config.build.env.variables[element[0]] = stdout.toString().replace('\n', '');
        });
    }
    if (config.project.env && config.project.env.variables) {
      config.project.env.variables = {
        ...defaultProcessEnv,
        ...config.project.env.variables
      };
    }

    if (config.project.env && config.project.env.variables) {
      Object.entries(config.project.env.variables)
        .filter((element) => element[1] !== '' && typeof element[1] === 'string')
        .forEach((element) => {
          element[1] = this._replaceEnv(config.project.env.variables, element[1]);
          const stdout = execSync(`echo "${element[1]}"`);
          config.project.env.variables[element[0]] = stdout.toString().replace('\n', '');
        });
      Object.assign(this._env, config.project.env.variables);
    }

    config.processEnv = {
      ...defaultProcessEnv,
      ...config.processEnv
    };

    if (config.processEnv) {
      Object.entries(config.processEnv)
        .filter((element) => element[1] !== '' && typeof element[1] === 'string')
        .forEach((element) => {
          element[1] = this._replaceEnv(config.processEnv, element[1]);
          const stdout = execSync(`echo "${element[1]}"`);
          config.processEnv[element[0]] = stdout.toString().replace('\n', '');
        });
      Object.assign(this._env, config.processEnv);
    }

    config = this._replaceEnvs(config.processEnv, config);

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
    return this.fetch.get('token').then((json) => Promise.resolve(json.data.accountId));
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
      if (error.message.includes('Error: Unable to find remote state')) {
        return;
      }
    }
    this.errors.push(error);
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

    this.ws = new WebSocket(this.parameters.config.api, process.env.TERRAHUB_TOKEN).ws;

    this.ws.on('message', (data) => {
      try {
        const parsedData = JSON.parse(data);

        if (parsedData.thubRunId !== this.runId) {
          return;
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
