'use strict';

const S3Helper = require('../helpers/s3-helper');
const { config, fetch } = require('../parameters');
const Dictionary = require("../helpers/dictionary");
const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const CloudDistributor = require('../helpers/cloud-distributor');
const { printListAsTree, uuid } = require('../helpers/util');

class RunCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('run')
      .setDescription('execute automated workflow terraform init > workspace > plan > apply > destroy')
      .addOption('apply', 'a', 'Enable apply command as part of automated workflow', Boolean, false)
      .addOption('destroy', 'd', 'Enable destroy command as part of automated workflow', Boolean, false)
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
      .addOption('dry-run', 'u', 'Prints the list of components that are included in the action', Boolean, false)
      .addOption('build', 'b', 'Enable build command as part of automated workflow', Boolean, false)
      .addOption('cloud', 'c', 'Run your terraform execution in cloud', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    if (this.getOption('dry-run')) {
      printListAsTree(this.getConfigObject(), this.getProjectConfig().name);
      return Promise.resolve('Done');
    }

    this._isApply = this.getOption('apply');
    this._isDestroy = this.getOption('destroy');
    this._isBuild = this.getOption('build');

    const config = this.getConfigObject();

    return this._getPromise(config)
      .then(isConfirmed => isConfirmed ? this._checkDependencies(config) : Promise.reject('Action aborted'))
      .then(() => this.getOption('cloud') ? this._runCloud(config) : this._runLocal(config))
      .then(() => Promise.resolve('Done'));
  }

  /**
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _getPromise(config) {
    return Promise.resolve().then(() => {
      if (this._isApprovementRequired) {
        return this.askForApprovement(config, this.getOption('auto-approve'));
      }

      this.warnExecutionStarted(config);
      return Promise.resolve(true);
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  _runLocal(config) {
    const actions = ['prepare', 'init', 'workspaceSelect'];
    const distributor = new Distributor(config);

    if (!this._isApply && !this._isDestroy) {
      if (this._isBuild) {
        actions.push('build');
      }

      actions.push('plan');
    }

    return distributor.runActions(actions, { silent: this.getOption('silent') })
      .then(() => !this._isApply ?
        Promise.resolve() :
        distributor.runActions(this._isBuild ? ['plan', 'build', 'apply'] : ['plan', 'apply'], {
          silent: this.getOption('silent'),
          dependencyDirection: Dictionary.DIRECTION.FORWARD
        })
      )
      .then(() => !this._isDestroy ?
        Promise.resolve() :
        distributor.runActions(['plan', 'destroy'], {
          silent: this.getOption('silent'),
          dependencyDirection: Dictionary.DIRECTION.REVERSE,
          planDestroy: true
        })
      );
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _runCloud(cfg) {
    const thubRunId = uuid();
    const actions = ['prepare', 'init', 'workspaceSelect', 'build', 'plan', 'apply'];
    const distributor = new CloudDistributor(cfg, thubRunId);
    const s3Helper = new S3Helper();

    const bucketName = S3Helper.METADATA_BUCKET;
    const s3Path = config.api.replace('api', 'projects');

    return this._fetchAndSetupCredentials()
      .then(accountId => s3Helper.uploadDirectory(
        this.getAppPath(),
        bucketName,
        [s3Path, accountId, thubRunId].join('/'),
        { exclude: ['**/node_modules/**', '**/.terraform/**', '**/.git/**'] }
      ))
      .then(() => distributor.runActions(actions))
      // delete directory from s3 in any case
      .then(() => s3Helper.deleteDirectoryFromS3(bucketName, s3Path))
      .catch(error => s3Helper.deleteDirectoryFromS3(bucketName, s3Path).then(() => Promise.reject(error)));
  }

  /**
   * @return {Promise}
   * @private
   */
  _fetchAndSetupCredentials() {
    return fetch.get('thub/temporary-credentials/retrieve').then(json => {
      Object.assign(process.env, json.data.credentials);

      return Promise.resolve(json.data.accountId);
    });
  }

  /**
   * Checks config dependencies in the corresponding order if check is required
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _checkDependencies(config) {
    let direction;
    switch (this._isApply * 1 + this._isDestroy * 2) {
      case 0:
        return Promise.resolve();

      case 1:
        direction = Dictionary.DIRECTION.FORWARD;
        break;

      case 2:
        direction = Dictionary.DIRECTION.REVERSE;
        break;

      case 3:
        direction = Dictionary.DIRECTION.BIDIRECTIONAL;
        break;
    }

    return this.checkDependencies(config, direction);
  }

  /**
   * @return {Boolean}
   * @private
   */
  get _isApprovementRequired() {
    return this.getOption('apply') || this.getOption('destroy');
  }
}

module.exports = RunCommand;
