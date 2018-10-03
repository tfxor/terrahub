'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { yesNoQuestion } = require('../helpers/util');

class ApplyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('apply')
      .setDescription('run `terraform apply` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);

    return this.checkDependencies(config)
      .then(() => this._getPromise())
      .then(answer => answer ?
        distributor.runActions(['prepare', 'plan', 'apply'], { 
          silent: this.getOption('silent'),
          dependencyDirection:'forward'
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
      return yesNoQuestion('Do you want to perform `apply` action? (Y/N) ');
    }
  }
}

module.exports = ApplyCommand;
