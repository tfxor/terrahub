'use strict';

const fse = require('fs-extra');
const JitHelper = require('../jit-helper');
const { promiseSeries } = require('../util');
// const BuildHelper = require('../build-helper');
const LambdaTerrahub = require('../wrappers/lamdbda-terrahub');
// const { Abstract: { AbstractGatewayLambda }, Helper } = require('lib-thub');

const AwsDistributor = require('./aws-distributor');

class DeployCreate extends AwsDistributor {
  /**
   * Preparation
   */
  prepare() {
    this.s3fs = new Helper.S3fs();
  }

  // /**
  //  * Validation schema
  //  * @param {Joi} Joi
  //  * @return {Object}
  //  */
  // schema(Joi) {
  //   return {
  //     actions: Joi.array().required(),
  //     thubRunId: Joi.string().required(),
  //     config: Joi.object().required()
  //   };
  // }

  /**
   * @param {Object} requestData
   * @return {Promise}
   */
  execute(requestData) {
    const { config, thubRunId, actions } = requestData;
    config.project.root = DeployCreate._projectDirectory;

    const s3Prefix = [`projects-${this.getEnv()}`, this.fetchAccountId(), thubRunId].join('/');

    return this.s3fs.syncPaths(DeployCreate._projectDirectory, s3Prefix, config.mapping)
      .then(() => JitHelper.jitMiddleware(config))
      .then(cfg => {
        return this._runActions(actions, cfg, thubRunId).then(() => {
          return cfg.isJit ?
            fse.remove(JitHelper.buildTmpPath(cfg)) :
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
  _runActions(actions, config, thubRunId) {
    const terrahub = new LambdaTerrahub(config, thubRunId, this.getAccountId(), this.db);

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
}

module.exports = DeployCreate;
