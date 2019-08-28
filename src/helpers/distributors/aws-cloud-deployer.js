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

  constructor({ s3: S3, parameters, publish }) {
    this.s3fs = new S3();
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

    ApiHelper.on('loggerWork', () => {
      const promises = ApiHelper.retrieveDataToSend();
      console.log('promises :', promises);

      return Promise.all(promises.map(({ url, body }) => ApiHelper.asyncFetch({ url, body })));
    });

    try {
      config.project.root = AwsDeployer._projectDirectory;
      const api = parameters.config.api.split('-')[1];
      const s3Prefix = [`projects-${api}`, await this._fetchAccountId(), thubRunId].join('/');
      await this.s3fs.syncPaths(AwsDeployer._projectDirectory, s3Prefix, config.mapping);
      const cfg = await JitHelper.jitMiddleware(config, parameters);
      await this._runActions(actions, cfg, thubRunId, parameters);

      if (cfg.isJit) {
        await fse.remove(JitHelper.buildTmpPath(cfg, parameters));
      }

      const promises = ApiHelper.retrieveDataToSend();
      await Promise.all(promises.map(({ url, body }) => ApiHelper.asyncFetch({ url, body })));

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

    logger.updateContext({
      runId: thubRunId,
      componentName: config.name
    });

    const tasks = actions.map(action => options => {
      logger.updateContext({ action: action });

      return action !== 'build' ? terrahub.getTask(action, options) : BuildHelper.getComponentBuildTask(config);
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
}

module.exports = AwsDeployer;
