'use strict';

const fse = require('fs-extra');
const JitHelper = require('../jit-helper');
const { promiseSeries } = require('../util');
const BuildHelper = require('../build-helper');
const Terrahub = require('../wrappers/terrahub');

class AwsDeployer {
  /**
   * Preparation
   */
  prepare() {
    this.s3fs = new Helper.S3fs();
  }

  /**
   * @param {Object} requestData
   * @return {Promise}
   */
  execute(requestData) {
    console.log('RequestData: ', requestData);
    const { config, thubRunId, actions, parameters } = requestData;
    config.project.root = DeployCreate._projectDirectory;

    const s3Prefix = [`projects-${parameters.config.api.replace('api', 'projects')}`, this._fetchAccountId(parameters), thubRunId].join('/');
    const s3directory = parameters.config.api.replace('api', 'projects');
    console.log('s3 :', s3Prefix, s3directory);

    return this.s3fs.syncPaths(DeployCreate._projectDirectory, s3Prefix, config.mapping)
      .then(() => JitHelper.jitMiddleware(config, parameters))
      .then(cfg => {
        return this._runActions(actions, cfg, thubRunId, parameters).then(() => {
          return cfg.isJit ?
            fse.remove(JitHelper.buildTmpPath(cfg, parameters)) :
            Promise.resolve();
        });
      })
      .then(() => Promise.resolve({
        message: `Component '${config.name}' has been successfully deployed.`,
        data: {}
      }));
  }

  /**
   * @param {String[]} actions
   * @param {Object} config
   * @param {String} thubRunId
   * @return {Promise}
   * @private
   */
  _runActions(actions, config, thubRunId, parameters) {
    // const terrahub = new LambdaTerrahub(config, thubRunId, this.getAccountId(), this.db);

    const terrahub = new Terrahub(config, process.env.THUB_RUN_ID, parameters);

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
  _fetchAccountId(parameters) {
    return parameters.fetch.get('thub/account/retrieve').then(json => Promise.resolve(json.data.id));
  }
}

module.exports = AwsDeployer;
