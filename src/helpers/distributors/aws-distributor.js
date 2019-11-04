'use strict';

const AWS = require('aws-sdk');
const fse = require('fs-extra');
const { join } = require('path');
const logger = require('../logger');
const S3Helper = require('../s3-helper');
const { globPromise, lambdaHomedir, removeAwsEnvVars } = require('../util');
const { defaultIgnorePatterns } = require('../../config-loader');

class AwsDistributor {

  /**
   * @param {Object} parameters
   * @param {Object} config
   * @param {Object} env
   * @param {Function} emit
   * @param {Function} webSocket
   */
  constructor(parameters, config, env, emit, webSocket) {
    this._errors = [];
    this.env = env;
    this.emit = emit;
    this.parameters = parameters;
    this.componentConfig = config;
    this.fetch = this.parameters.fetch;
    this.config = this.parameters.config;
    this._projectRoot = this.componentConfig.project.root;
    this.webSocket = webSocket;

    this._validateRequirements();
    this._subscribe();
  }

  _subscribe() {
    if (!this.webSocket) {
      throw new Error('WebSocket is not initialized.');
    }

    this.webSocket.on('message', data => {
      try {
        const parsedData = JSON.parse(data);
        const defaultMessage = { worker: 'lambda', hash: this.componentConfig.hash };
        if (parsedData.action === 'aws-cloud-deployer' && parsedData.data.message) {
          const { data: { isError, hash, message } } = parsedData;
          if (!isError && this.componentConfig.hash === hash) {
            if (!this._errors.length) { //TODO need this verification ?
              logger.info(`[${this.componentConfig.name}] Successfully deployed!`);
            }

            this.emit('message', { ...defaultMessage, ...{ isError, message } });
            this.emit('exit', { ...defaultMessage, ...{ code: 0 } });
          }
          if (isError && this.componentConfig.hash === hash) {
            this._errors.push(`[${this.componentConfig.name}] ${message.data.message}`);

            this.emit('message', { ...defaultMessage, ...{ isError: true, message: this._errors } });
            this.emit('exit', { ...defaultMessage, ...{ code: 1 } });
          }
        }
      } catch (err) {
        throw new Error(err);
      }
    });
  }

  /**
   * @param {String[]} actions
   * @param {String} runId
   * @return {EventInit}
   */
  async distribute({ actions, runId }) {
    await this._updateCredentialsForS3();
    const s3Helper = new S3Helper({ credentials: new AWS.EnvironmentCredentials('AWS') });
    const s3directory = this.config.api.replace('api', 'projects');

    const [accountId, files] = await Promise.all([this._fetchAccountId(), this._buildFileList()]);
    console.log(`[${this.componentConfig.name}] Uploading project to S3.`);

    const s3Prefix = [s3directory, accountId, runId].join('/');
    const pathMap = files.map(it => ({
      localPath: join(this._projectRoot, it),
      s3Path: [s3Prefix, it].join('/')
    }));

    await s3Helper.uploadFiles(S3Helper.METADATA_BUCKET, pathMap);
    logger.warn(`[${this.componentConfig.name}] Directory uploaded to S3.`);

    this.parameters.hclPath = this.parameters.hclPath.replace('/cache', lambdaHomedir);
    const body = JSON.stringify({
      actions: actions,
      thubRunId: runId,
      config: this.componentConfig,
      parameters: this.parameters
    });

    try {
      const postResult = await this.fetch.post('cloud-deployer/aws/create', { body });
      logger.warn(`[${this.componentConfig.name}] ${postResult.message}!`);
    } catch (err) {
      this._errors.push(err);
    }
  }

  /**
   * @return {void}
   * @throws {error}
   * @private
   */
  _validateRequirements() {
    if (!this.config.token) { throw new Error('[AWS distributor] Please provide THUB_TOKEN.'); }
    if (!this.config.logs) { throw new Error('[AWS distributor] Please enable logging in `.terrahub.json`.'); }

    const { cloudAccount } = this.componentConfig.terraform;
    if (!cloudAccount) {
      const errorMessage = `[AWS distributor] '${this.componentConfig.name}' do not have` +
        ` CloudAccount in config.`;

      throw new Error(errorMessage);
    }
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
   * @return {Promise<String>}
   */
  _fetchAccountId() {
    return this.fetch.get('thub/account/retrieve').then(json => Promise.resolve(json.data.id));
  }

  /**
   * @return {Promise<Object>}
   * @private
   */
  _fetchTemporaryCredentials() {
    return this.fetch.get('thub/credentials/retrieve').then(json => Promise.resolve(json.data));
  }

  /**
   * @return {void}
   * @throws {error}
   * @private
   */
  async _updateCredentialsForS3() {
    removeAwsEnvVars();
    const tempCreds = await this._fetchTemporaryCredentials();
    if (!tempCreds) { throw new Error('[AWS Distributor] Can not retrieve temporary credentials.'); }

    Object.assign(process.env, {
      AWS_ACCESS_KEY_ID: tempCreds.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: tempCreds.SecretAccessKey,
      AWS_SESSION_TOKEN: tempCreds.SessionToken
    });
  }
}

module.exports = AwsDistributor;
