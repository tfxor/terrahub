'use strict';

const Dictionary = require('../helpers/dictionary');
const { printListAsTree } = require('../helpers/util');
const TerraformCommand = require('../terraform-command');
const Distributor = require('../helpers/distributors/thread-distributor');
const CloudDistributor = require('../helpers/distributors/cloud-distributor');

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
    this._isApply = this.getOption('apply');
    this._isDestroy = this.getOption('destroy');
    this._isBuild = this.getOption('build');

    const config = this.getFilteredConfig();

    this._checkDependencies(config);

    if (this.getOption('dry-run')) {
      printListAsTree(config, this.getProjectConfig().name);

      return Promise.resolve('Done');
    }

    return this._getPromise(config)
      .then(isConfirmed => {
        if (!isConfirmed) {
          return Promise.reject('Action aborted');
        }

        return this.getOption('cloud') ? this._runCloud(config) : this._runLocal(config);
      })
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
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _runLocal(config) {
    const actions = ['prepare', 'init', 'workspaceSelect'];
    this.distributor = new Distributor(config);

    console.log('_runLocal', this.distributor);
    if (!this._isApply && !this._isDestroy) {
      if (this._isBuild) {
        actions.push('build');
      }

      actions.push('plan');
    }

    return this.distributor.runActions(actions)
      .then(() => !this._isApply ?
        Promise.resolve() :
        this.distributor.runActions(this._isBuild ? ['build', 'plan', 'apply'] : ['plan', 'apply'], {
          dependencyDirection: Dictionary.DIRECTION.FORWARD
        })
      )
      .then(() => !this._isDestroy ?
        Promise.resolve() :
        this.distributor.runActions(['plan', 'destroy'], {
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
    const actions = ['prepare', 'init', 'workspaceSelect', 'plan', 'apply'];
    this.distributor = new CloudDistributor(cfg);

    console.log('run cloud');

    return this.distributor.runActions(actions, { dependencyDirection: Dictionary.DIRECTION.FORWARD });
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

  stopExecution() {
    console.log('Stoping exuction :*)', this.distributor);
    if(this.distributor) {
      this.distributor.disconnect();
    } else {
      super.stopExecution();
    }
  }
}

module.exports = RunCommand;
