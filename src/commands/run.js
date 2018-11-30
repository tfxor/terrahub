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
      .addOption('build', 'b', 'Enable build command as part of automated workflow', Boolean, false)
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

    const isApply = this.getOption('apply');
    const isDestroy = this.getOption('destroy');
    const isBuild = this.getOption('build');

    return Promise.resolve()
      .then(() => {
        switch (isApply * 1 + isDestroy * 2) {
          case 0:
            return Promise.resolve();

          case 1:
            direction = TerraformCommand.FORWARD;
            break;

          case 2:
            direction = TerraformCommand.REVERSE;
            break;

          case 3:
            direction = TerraformCommand.BIDIRECTIONAL;
            break;
        }

        return this.checkDependencies(config, direction);
      })
      .then(() => {
        const actions = ['prepare', 'init', 'workspaceSelect'];

        if (!isApply && !isDestroy) {
          actions.push('plan');

          if (isBuild) {
            actions.push('build');
          }
        }

        return distributor.runActions(actions, {
          silent: this.getOption('silent')
        });
      })
      .then(() => !isApply ?
        Promise.resolve() :
        distributor.runActions(isBuild ? ['plan', 'build', 'apply'] : ['plan', 'apply'], {
          silent: this.getOption('silent'),
          dependencyDirection: TerraformCommand.FORWARD
        })
      )
      .then(() => !isDestroy ?
        Promise.resolve() :
        distributor.runActions(['plan', 'destroy'], {
          silent: this.getOption('silent'),
          dependencyDirection: TerraformCommand.REVERSE
        })
      );
  }

  /**
   * @return {Promise}
   * @private
   */
  _getPromise() {
    if (this.getOption('auto-approve') || !(this.getOption('apply') || this.getOption('destroy'))) {
      return Promise.resolve(true);
    } else {
      return askForApprovement(this.getConfigObject(), 'run', this.getProjectConfig());
    }
  }
}

module.exports = RunCommand;
