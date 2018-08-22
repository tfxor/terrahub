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
    this._actions = ['build', 'apply', 'destroy'].filter(action => this.getOption(action));

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
      .then(() => this._actions.includes('apply') ? this.checkDependencies(config) : Promise.resolve())
      .then(() => this._actions.includes('destroy') ? this.checkDependenciesReverse(config) : Promise.resolve())
      .then(() => distributor.runActions(['prepare', 'init', 'workspaceSelect', 'plan']))
      .then(() => {
        const actions = ['build', 'apply'].filter(action => this._actions.includes(action));

        if (actions.length) {
          return distributor.runActions(actions, 'forward');
        }

        return Promise.resolve();
      })
      .then(() => {
        if (this._actions.includes('destroy')) {
          return distributor.runActions(['destroy'], 'reverse');
        }

        return Promise.resolve();
      });
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
