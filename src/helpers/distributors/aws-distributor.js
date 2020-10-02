'use strict';

const AWS = require('aws-sdk');
const fse = require('fs-extra');
const { join } = require('path');
const logger = require('../logger');
const S3Helper = require('../s3-helper');
const { globPromise, lambdaHomedir, removeAwsEnvVars, setTimeoutPromise } = require('../util');
const { defaultIgnorePatterns } = require('../../config-loader');

class AwsDistributor {

  /**
   * @param {Object} parameters
   * @param {Object} config
   * @param {Object} env
   */
  constructor(parameters, config, env) {
    this.env = env;
    this.parameters = parameters;
    this.componentConfig = config;
    this.fetch = this.parameters.fetch;
    this.config = this.parameters.config;
    this._projectRoot = this.componentConfig.project.root;

    this._validateRequirements();
  }

  /**
   * @param {String[]} actions
   * @param {String} runId
   * @param {String} accountId
   * @param {Number} importIndex
   * @param {Number} indexCount
   * @return {void}
   */
  async distribute({ actions, runId, accountId, importIndex, indexCount }) {
    try {
      await this._updateCredentialsForS3();
      const s3Helper = new S3Helper({ credentials: new AWS.EnvironmentCredentials('AWS') });
      const s3directory = this.config.api.replace('api', 'projects');
      const files = await this._buildFileList();

      const s3Prefix = [s3directory, accountId, runId].join('/');
      const pathMap = files.map(it => ({
        localPath: join(this._projectRoot, it),
        s3Path: [s3Prefix, it].join('/')
      }));

      await s3Helper.uploadFiles(S3Helper.METADATA_BUCKET, pathMap);
      logger.warn(`[${this.componentConfig.name}] Upload to S3 was successful.`);

      this.parameters.hclPath = this.parameters.hclPath.replace('/cache', lambdaHomedir);

      const getLine = () => JSON.stringify([JSON.parse(this.env.importLines)[importIndex]]);

      const body = JSON.stringify({
        actions: actions,
        thubRunId: runId,
        config: this.componentConfig,
        parameters: this.parameters,
        env: importIndex ? {...this.env, ...{ importLines: getLine(), importIndex: importIndex }}  : this.env
      });

      if (indexCount !== 0 && indexCount % 5 === 0) {
        logger.log(`[AWS Distributor] Waiting... ${indexCount + 35} seconds`);
        await setTimeoutPromise((indexCount + 35) * 1000);
      }

      const postResult = await this.fetch.post('cloud-deployer/aws/create', { body });
      logger.warn(`[${this.componentConfig.name}] ${postResult.message}!`);
      await Promise.resolve();
    } catch (err) {
      throw new Error(`[AWS Distributor]: ${err}`);
    }
  }

  /**
   * @return {void}
   * @throws {error}
   * @private
   */
  _validateRequirements() {
    if (!this.config.token) { throw new Error('[AWS distributor] THUB_TOKEN is missing, but is required.'); }
    if (!this.config.logs) { throw new Error('[AWS distributor] THUB_LOGS is missing, but is required.'); }

    const { cloudAccount } = this.componentConfig.terraform;
    if (!cloudAccount) {
      const errorMessage = `[AWS distributor] 'cloudAccount' configuration is required for` +
        ` '${this.componentConfig.name}' component.`;

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
    if (!tempCreds) { throw new Error('[AWS Distributor] Could NOT retrieve temporary credentials.'); }

    Object.assign(process.env, {
      AWS_ACCESS_KEY_ID: tempCreds.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: tempCreds.SecretAccessKey,
      AWS_SESSION_TOKEN: tempCreds.SessionToken
    });
  }
}

module.exports = AwsDistributor;
