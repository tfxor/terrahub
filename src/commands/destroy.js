'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { yesNoQuestion } = require('../helpers/util');

class DestroyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('destroy')
      .setDescription('run `terraform destroy` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);

    return this.checkDependencies(config, TerraformCommand.REVERSE)
      .then(() => this._getPromise())
      .then(answer => answer ?
        distributor.runActions(['prepare', 'plan', 'destroy'], {
          silent: this.getOption('silent'),
          planDestroy: true,
          dependencyDirection: TerraformCommand.REVERSE
        }) : Promise.reject('Action aborted')
      ).then(() => Promise.resolve('Done'));
  }

  /**
   * @return {Promise}
   * @private
   */
  _getPromise() {
    if (this.getOption('auto-approve')) {
      return Promise.resolve(true);
    } else {
      return this.askForApprovement(this.getConfigObject());
    }
  }

  askForApprovement(config) {
    const length = Object.keys(config).length;
    if (length < 5) {
      this.printConfigCommaSeparated(config);
    } else {
      this.printConfigAsList(config);
    }
    return yesNoQuestion(`Do you want to perform destroy action? (Y/N) `);
  }
}

module.exports = DestroyCommand;
