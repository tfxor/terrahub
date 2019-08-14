'use strict';

const fse = require('fs-extra');
const Fetch = require('../fetch');
const JitHelper = require('../jit-helper');
const { promiseSeries } = require('../util');
const BuildHelper = require('../build-helper');
const Terrahub = require('../wrappers/terrahub');

class AwsDeployer {

  constructor(S3fs) {
    this.s3fs = new S3fs;
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
    this.fetch = new Fetch(parameters.fetch.baseUrl, parameters.fetch.authorization);
    config.project.root = AwsDeployer._projectDirectory;
    const s3Prefix = [`projects-${parameters.config.api}`, await this._fetchAccountId(), thubRunId].join('/');

    await this.s3fs.syncPaths(AwsDeployer._projectDirectory, s3Prefix, config.mapping);
    const cfg = await JitHelper.jitMiddleware(config, parameters);
    await this._runActions(actions, cfg, thubRunId, parameters);
    await cfg.isJit ? fse.remove(JitHelper.buildTmpPath(cfg, parameters)) : Promise.resolve();

    return {
      message: `Component '${config.name}' has been successfully deployed.`,
      data: {}
    }
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
    const terrahub = new Terrahub(config, thubRunId, parameters);

    const tasks = actions.map(action =>
      options => (action !== 'build' ? terrahub.getTask(action, options) : BuildHelper.getComponentBuildTask(config))
    );

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
