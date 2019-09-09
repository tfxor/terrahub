'use strict';

const fse = require('fs-extra');
const { join } = require('path');
const S3Helper = require('../s3-helper');
const ApiHelper = require('../api-helper');
const Websocket = require('./websocket');
const { defaultIgnorePatterns } = require('../../config-loader');
const {
  globPromise, retrieveSourceProfile, prepareCredentialsFile, createCredentialsFile, tempPath, lambdaHomedir
} = require('../util');

class AwsDistributor {

  /**
   * @param {Object} parameters
   * @param {Object} config
   * @param {EventListenerObject} emitter
   */
  constructor(parameters, config, emitter) {
    this.parameters = parameters;
    this.componentConfig = config;
    this.emitter = emitter;
    this._projectRoot = this.componentConfig.project.root;
    this.parameters.isCloud = true;
    this.config = this.parameters.config;
    this.fetch = this.parameters.fetch;

    this._errors = [];
  }

  async distribute({ actions, runId }) {
    const cloudAccounts = await this._validateRequirements();
    this.updateEnvirmentVariables(cloudAccounts);

    const { data: { ticket_id } } = await this.websocketTicketCreate();
    const { ws } = new Websocket(this.config.api, ticket_id);

    let inProgress = 0;

    const s3Helper = new S3Helper();
    const s3directory = this.config.api.replace('api', 'projects');

    const [accountId, files] = await Promise.all([this._fetchAccountId(), this._buildFileList()]);
    console.log('Uploading project to S3.');

    const s3Prefix = [s3directory, accountId, runId].join('/');

    console.log({ accountId, files, s3Prefix });

    const pathMap = files.map(it => ({
      localPath: join(this._projectRoot, it),
      s3Path: [s3Prefix, it].join('/')
    }));

    await s3Helper.uploadFiles(S3Helper.METADATA_BUCKET, pathMap);
    console.log('Directory uploaded to S3.');

    this.parameters.jitPath = this.parameters.jitPath.replace('/cache', lambdaHomedir);

    const body = JSON.stringify({
      actions: actions,
      thubRunId: runId,
      config: this.componentConfig,
      parameters: this.parameters
    });

    inProgress++;

    try {
      const postResult = await this.fetch.post('cloud-deployer/aws/create', { body });
      console.log(`[${this.componentConfig.name}] ${postResult.message}!`);
    } catch (err) {
      this._dependencyTable = {};
      this._errors.push(err);
    }

    ws.on('message', data => {
      try {
        const message = JSON.parse(data);

        if (AwsDistributor._isFinishMessage(message, this.componentConfig.hash)) {
          if (!this._errors.length) {
            console.log(`[${this.componentConfig.name}] Successfully deployed!`);
          }

          inProgress--;

          console.log('ws on message: ', message);

          setImmediate(() => this.emitter.emit('message', { worker: '123456789', data: message }));
        }
        if (AwsDistributor._isFinishMessageWithErrors(message, this.componentConfig.hash)) {
          this._dependencyTable = {};
          this._errors.push(`[${this.componentConfig.name}] ${message.data.message}`);

          setImmediate(() => this.emitter.emit('exit', { isError: true, message: this._errors }));
        }
      } catch (err) {
        throw new Error(err);
      }
    });

  }


  /**
   * @param {String[]} actions
   * @param {Number} dependencyDirection
   * @return {Promise}
   * @override
   */
  async runActions(actions, { dependencyDirection = null } = {}) {
    const cloudAccounts = await this._validateRequirements();
    this.updateEnvirmentVariables(cloudAccounts);

    const { data: { ticket_id } } = await this.websocketTicketCreate();
    const { ws } = new Websocket(this.config.api, ticket_id);

    let inProgress = 0;

    const s3Helper = new S3Helper();
    const s3directory = this.config.api.replace('api', 'projects');

    // this._dependencyTable = this.buildDependencyTable(dependencyDirection);
    const [accountId, files] = await Promise.all([this._fetchAccountId(), this._buildFileList()]);
    // this.logger.warn('Uploading project to S3.');
    console.log('Uploading project to S3.');

    const s3Prefix = [s3directory, accountId, this.runId].join('/');
    const pathMap = files.map(it => ({
      localPath: join(this._projectRoot, it),
      s3Path: [s3Prefix, it].join('/')
    }));

    await s3Helper.uploadFiles(S3Helper.METADATA_BUCKET, pathMap);
    // this.logger.warn('Directory uploaded to S3.');
    console.log('Directory uploaded to S3.');


    return new Promise((resolve, reject) => {
      /**
       * @private
       */
      const _distributeConfigs = () => {
        Object.keys(this._dependencyTable).forEach(hash => {
          const dependencies = this._dependencyTable[hash];

          if (!Object.keys(dependencies).length) {
            delete this._dependencyTable[hash];

            _callLambdaExecutor(hash, _onFinishExecution);
          }
        });
      };

      /**
       * @param {String} hash
       * @param {Object} config
       * @return {void}
       * @private
       */
      const _onFinishExecution = (hash, config) => {
        this.removeDependencies(this._dependencyTable, hash);

        if (!this._errors.length) {
          this.logger.info(`[${config.name}] Successfully deployed!`);
        }

        inProgress--;

        if (Object.keys(this._dependencyTable).length) {
          _distributeConfigs();
        } else if (!inProgress) {
          if (this._errors.length) {
            return reject(this._errors);
          }

          return resolve();
        }
      };

      /**
       * @param {String} hash
       * @param {Function} callback
       * @private
       */
      const _callLambdaExecutor = async (hash, callback) => {
        const config = this.projectConfig[hash];
        this.parameters.jitPath = this.parameters.jitPath.replace('/cache', lambdaHomedir);

        const body = JSON.stringify({
          actions: actions,
          thubRunId: this.runId,
          config: config,
          parameters: this.parameters
        });

        inProgress++;

        try {
          const postResult = await this.fetch.post('cloud-deployer/aws/create', { body });
          this.logger.warn(`[${config.name}] ${postResult.message}!`);
        } catch (err) {
          this._dependencyTable = {};
          this._errors.push(err);
        }

        ws.on('message', data => {
          try {
            const message = JSON.parse(data);

            if (AwsDistributor._isFinishMessage(message, hash)) {
              return callback(hash, config);
            }
            if (AwsDistributor._isFinishMessageWithErrors(message, hash)) {
              this._dependencyTable = {};
              this._errors.push(`[${config.name}] ${message.data.message}`);

              return callback(hash, config);
            }
          } catch (err) {
            throw new Error(err);
          }
        });
      };

      _distributeConfigs();
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  async _validateRequirements() {
    if (!this.config.logs) {
      throw new Error('Please enable logging in `.terrahub.json`.');
    }

    const { cloudAccount, backendAccount } = this.componentConfig.terraform;

    if (!cloudAccount || !backendAccount) {
      const errorMessage = `'${this.componentConfig.name}' do not have` +
        ` CloudAccount and/or BackendAccount in config.`;

      throw new Error(errorMessage);
    }

    const cloudAccounts = await ApiHelper.retrieveCloudAccounts();
    if (!cloudAccounts.aws.some(it => it.name === cloudAccount)) {
      const errorMessage = `'${this.componentConfig.name}' component do not have` +
        ` valid backendAccount in config.`;

      throw new Error(errorMessage);
    }

    return cloudAccounts;
  }

  /**
   * @param {Object} cloudAccounts
   */
  updateEnvirmentVariables(cloudAccounts) {
    // Object.keys(this.componentConfig).forEach(hash => {
    const { cloudAccount } = this.componentConfig.terraform;
    const accountData = cloudAccounts.aws.find(it => it.name === cloudAccount);

    if (!accountData) {
      return;
    }

    const sourceProfile = retrieveSourceProfile(accountData, cloudAccounts);
    const credentials = prepareCredentialsFile(
      accountData, sourceProfile, this.componentConfig, false, this.parameters.isCloud);

    ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AWS_PROFILE']
      .forEach(it => delete process.env[it]);

    const cloudCredsPath = createCredentialsFile(
      credentials, this.componentConfig, 'cloud', this.parameters.isCloud);

    if (sourceProfile) {
      Object.assign(process.env, {
        AWS_CONFIG_FILE: join(tempPath(this.componentConfig, this.parameters.isCloud), '.aws/config'),
        AWS_SDK_LOAD_CONFIG: 1
      });
    }

    Object.assign(process.env, { AWS_SHARED_CREDENTIALS_FILE: cloudCredsPath, AWS_PROFILE: 'default' });
    // });
  }

  /**
   * @param {Object} message
   * @param {String} componentHash
   * @return {Boolean}
   * @private
   */
  static _isFinishMessage(message, componentHash) {
    const { action, data: { status, hash } } = message;

    return action === 'aws-cloud-deployer' && status === 'finish' && componentHash === hash;
  }

  /**
   * @param {Object} message
   * @param {String} componentHash
   * @return {Boolean}
   * @private
   */
  static _isFinishMessageWithErrors(message, componentHash) {
    const { action, data: { status, hash } } = message;

    return action === 'aws-cloud-deployer' && status === 'error' && componentHash === hash;
  }

  /**
   * @description Returns the current execution file mapping
   * @return {String[]}
   * @private
   */
  _getExecutionMapping() {
    const componentMappings = [].concat(...this.componentConfig.mapping);

    return [...new Set(componentMappings)];
  }

  /**
   * @description Returns an array of files' paths required for the current execution
   * @return {Promise<String[]>}
   * @private
   */
  _buildFileList() {
    const mapping = this._getExecutionMapping();

    return Promise.all(mapping.map(path => fse.stat(path).then(stats => {
      if (stats.isFile()) {
        return [path];
      }

      if (stats.isDirectory()) {
        return globPromise(join(path, '**'), {
          cwd: this._projectRoot,
          dot: true,
          ignore: defaultIgnorePatterns,
          nodir: true
        });
      }

      return [];
    }))).then(results => [].concat(...results));
  }

  /**
   * @return {Promise}
   */
  websocketTicketCreate() {
    return this.fetch.get('thub/ticket/create');
  }


  /**
   * @return {Promise<String>}
   */
  _fetchAccountId() {
    return this.fetch.get('thub/account/retrieve').then(json => Promise.resolve(json.data.id));
  }
}

module.exports = AwsDistributor;
