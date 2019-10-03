'use strict';

const fse = require('fs-extra');
const Fetch = require('../fetch');
const logger = require('../logger');
const ApiHelper = require('../api-helper');
const JitHelper = require('../jit-helper');
const { promiseSeries } = require('../util');
const BuildHelper = require('../build-helper');
const Terrahub = require('../wrappers/terrahub');

class AwsDeployer {

  constructor({ s3fs, parameters, publish }) {
    this.s3Helper = s3fs;
    this.fetch = new Fetch(parameters.fetch.baseUrl, parameters.fetch.authorization);
    this.publish = publish;
  }

  /**
   * Preparation
   */
  prepare() {}

  /**
   * @param {Object} requestData
   * @return {Promise}
   */
  async deploy(requestData) {
    const { config, thubRunId, actions, parameters } = requestData;
    await this._updateCredentialsForS3();

    ApiHelper.on('loggerWork', () => {
      const promises = ApiHelper.retrieveDataToSend();

      return Promise.all(ApiHelper.asyncFetch(promises));
    });

    try {
      config.project.root = AwsDeployer._projectDirectory;
      const api = parameters.config.api.split('-')[1];
      const accountId = await this._fetchAccountId();
      const s3Prefix = [`projects-${api}`, accountId, thubRunId].join('/');

      await this.s3Helper.syncPaths(config.project.root, s3Prefix, config.mapping);

      const cfg = await JitHelper.jitMiddleware(config, parameters);
      await this._runActions(actions, cfg, thubRunId, parameters);

      if (cfg.isJit) {
        await fse.remove(JitHelper.buildTmpPath(cfg, parameters));
      }

      const promises = ApiHelper.retrieveDataToSend();
      await Promise.all(ApiHelper.asyncFetch(promises));

    } catch (error) {
      return {
        message: error.message || error,
        hash: config.hash,
        status: 'error'
      };
    }

    return {
      message: `Component '${config.name}' has been successfully deployed.`,
      hash: config.hash,
      status: 'finish'
    };
  }

  /**
   * @param {String[]} actions
   * @param {Object} config
   * @param {String} thubRunId
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  async _runActions(actions, config, thubRunId, parameters) {
    const terrahub = new Terrahub(config, thubRunId, parameters, this.publish);
    const { distributor } = config;

    logger.updateContext({
      runId: thubRunId,
      componentName: config.name
    });

    const tasks = actions.map(action => options => {
      logger.updateContext({ action: action });

      return action !== 'build'
        ? terrahub.getTask(action, options)
        : BuildHelper.getComponentBuildTask(config, distributor);
    });

    return promiseSeries(tasks, (prev, fn) => prev.then(data => fn(data ? { skip: !!data.skip } : {})));
  }

  /**
   * @return {String}
   * @private
   */
  static get _projectDirectory() {
    return '/tmp/project';
  }

  /**
   * @return {Promise<String>}
   * @private
   */
  async _fetchAccountId() {
    const json = await this.fetch.get('thub/account/retrieve');
    const data = await json.data;

    return data.id;
  }

  /**
   * @return {void}
   * @throws {error}
   * @private
   */
  async _updateCredentialsForS3() {
    ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
      'AWS_PROFILE', 'AWS_CONFIG_FILE', 'AWS_LOAD_CONFIG'].forEach(it => delete process.env[it]);

    const tempCreds = await this._fetchTemporaryCredentials();
    if (!tempCreds) {
      throw new Error('[AWS Distributor] Can not retrieve temporary credentials.');
    }

    Object.assign(process.env, {
      AWS_ACCESS_KEY_ID: tempCreds.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: tempCreds.SecretAccessKey,
      AWS_SESSION_TOKEN: tempCreds.SessionToken
    });
  }

  /**
   * @return {Promise<Object>}
   * @private
   */
  _fetchTemporaryCredentials() {
    return this.fetch.get('thub/credentials/retrieve').then(json => Promise.resolve(json.data));
  }
}

module.exports = AwsDeployer;
