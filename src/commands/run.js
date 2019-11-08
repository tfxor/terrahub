'use strict';

const Dictionary = require('../helpers/dictionary');
const DistributedCommand = require('../distributed-command');
const { printListAsTree } = require('../helpers/log-helper');

class RunCommand extends DistributedCommand {
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
      .addOption('build', 'b', 'Enable build command as part of automated workflow', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  async run() {
    this._isApply = this.getOption('apply');
    this._isDestroy = this.getOption('destroy');
    this._isBuild = this.getOption('build');

    const config = this.getFilteredConfig();

    this._checkDependencies(config);

    if (this.getOption('dry-run')) {
      printListAsTree(config, this.getProjectConfig().name);

      return Promise.resolve('Done');
    }

    const isConfirmed = await this._getPromise(config);
    if (!isConfirmed) {
      throw new Error('Action aborted');
    }

    return this._run(config);
  }

  /**
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  async _getPromise(config) {
    if (this._isApprovementRequired) {
      return this.askForApprovement(config, this.getOption('auto-approve'));
    }

    this.warnExecutionStarted(config);
    return true;
  }

  /**
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _run(config) {
    const actions = ['prepare', 'init', 'workspaceSelect'];

    if (!this._isApply && !this._isDestroy) {
      if (this._isBuild) {
        actions.push('build');
      }

      actions.push('plan');
    }

    const defaultRun = [{ actions, config: config, dependencyDirection: Dictionary.DIRECTION.FORWARD }];

    const applyRun = !this._isApply ? false : [{
      actions: [...actions, ...this._isBuild ? ['build', 'plan', 'apply'] : ['plan', 'apply']],
      config: config,
      dependencyDirection: Dictionary.DIRECTION.FORWARD
    }];

    const destroyRun = !this._isDestroy ? false : [{
      actions: [...actions, ...['plan', 'destroy']],
      config: config,
      dependencyDirection: Dictionary.DIRECTION.REVERSE,
      planDestroy: true
    }];

    return Promise.resolve(destroyRun || applyRun || defaultRun );
  }

  /**
   * Checks config dependencies in the corresponding order if check is required
   * @param {Object} config
   * @private
   */
  _checkDependencies(config) {
    let direction;
    switch (+this._isApply + +this._isDestroy * 2) {
      case 0:
        return;

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

    this.checkDependencies(config, direction);
  }

  /**
   * @return {Boolean}
   * @private
   */
  get _isApprovementRequired() {
    return ['apply', 'destroy'].some(it => this.getOption(it));
  }
}

module.exports = RunCommand;
