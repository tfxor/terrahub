'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { yesNoQuestion } = require('../helpers/util');

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
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this._actions = ['apply', 'destroy'].filter(action => this.getOption(action));

    return this._getPromise()
      .then(answer => {
        if (answer) {
          return this._runPhases();
        } else {
          return Promise.reject('Action aborted');
        }
      })
      .then(() => Promise.resolve('Done'));
  }

  /**
   * @return {Promise}
   * @private
   */
  _runPhases() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);

    return Promise.resolve()
      .then(() => this._actions.includes('apply') ?
        this.checkDependencies(config) : Promise.resolve())
      .then(() => this._actions.includes('destroy') ?
        this.checkDependenciesReverse(config) : Promise.resolve())
      .then(() => distributor.runActions(this._actions.length ? 
        ['prepare', 'init', 'workspaceSelect'] : 
        ['prepare', 'init', 'workspaceSelect', 'plan'], {
          silent: this.getOption('silent')
        }))
      .then(() => this._actions.includes('apply') ?
        distributor.runActions(['plan', 'apply'], { 
          silent: this.getOption('silent'),
          dependencyDirection: 'forward'
        }) : Promise.resolve())
      .then(() => this._actions.includes('destroy') ?
        distributor.runActions(['plan', 'destroy'], { 
          silent: this.getOption('silent'),
          dependencyDirection: 'reverse',
          planDestroy: true
        }) : Promise.resolve());
  }

  /**
   * @return {Promise}
   * @private
   */
  _getPromise() {
    if (this.getOption('auto-approve') || !this._actions.length) {
      return Promise.resolve(true);
    } else {
      return yesNoQuestion('Do you want to perform `run` action? (Y/N) ');
    }
  }
}

module.exports = RunCommand;
