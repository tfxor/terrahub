'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { yesNoQuestion, promiseSeries } = require('../helpers/util');

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
    const order = this.getTarjanOrder();

    const distributors = [new Distributor(order,
      ['prepare', 'init', 'workspaceSelect', 'plan'], { isOrderDependent: false })];

    distributors.push(...this._actions.map(action => new Distributor(order, [action])));

    return this._getPromise()
      .then(answer => {
        if (answer) {
          return promiseSeries(distributors.map(it => () => it.run()));
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
  _getPromise() {
    if (this.getOption('auto-approve') || !this._actions.length) {
      return Promise.resolve(true);
    } else {
      return yesNoQuestion('Do you want to perform `run` action? (Y/N) ');
    }
  }
}

module.exports = RunCommand;
