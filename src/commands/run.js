'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { printConfigAsList, askForApprovement } = require('../helpers/util');

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
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    if (this.getOption('dry-run')) {
      printConfigAsList(this.getConfigObject(), this.getProjectConfig());
      return Promise.resolve('Done');
    }

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
      .then(() => {
        if (!this._actions.length) {
          return Promise.resolve();
        }

        let direction;
        if (this._actions.length === 2) {
          direction = TerraformCommand.BIDIRECTIONAL;
        } else if (this._actions.includes('apply')) {
          direction = TerraformCommand.FORWARD;
        } else {
          direction = TerraformCommand.REVERSE;
        }

        return this.checkDependencies(config, direction);
      })
      .then(() => distributor.runActions(this._actions.length ?
        ['prepare', 'init', 'workspaceSelect'] :
        ['prepare', 'init', 'workspaceSelect', 'plan'], {
        silent: this.getOption('silent')
      }))
      .then(() => this._actions.includes('apply') ?
        distributor.runActions(['plan', 'apply'], {
          silent: this.getOption('silent'),
          dependencyDirection: TerraformCommand.FORWARD
        }) : Promise.resolve())
      .then(() => this._actions.includes('destroy') ?
        distributor.runActions(['plan', 'destroy'], {
          silent: this.getOption('silent'),
          dependencyDirection: TerraformCommand.REVERSE,
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
      return askForApprovement(this.getConfigObject(), 'run', this.getProjectConfig());
    }
  }
}

module.exports = RunCommand;
