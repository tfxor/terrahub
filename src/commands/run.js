'use strict';

const Dictionary = require("../helpers/dictionary");
const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { printListAsTree } = require('../helpers/util');

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

    const config = this.getConfigObject();

    return this._getPromise(config)
      .then(answer => answer ? this._runPhases(config) : Promise.reject('Action aborted'))
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
  _runPhases(config) {
    const distributor = new Distributor(config);

    this._isApply = this.getOption('apply');
    this._isDestroy = this.getOption('destroy');
    this._isBuild = this.getOption('build');

    return this._checkDependencies(config)
      .then(() => {
        const actions = ['prepare', 'init', 'workspaceSelect'];

        if (!this._isApply && !this._isDestroy) {
          if (this._isBuild) {
            actions.push('build');
          }

          actions.push('plan');
        }

        return distributor.runActions(actions, {
          silent: this.getOption('silent')
        });
      })
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
