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
    const config = this.getConfigTree();
    const distributor = new Distributor(config, { env: this.buildEnv(['prepare', 'destroy']) });

    return this._getPromise()
      .then(answer => {
        if (answer) {
          return distributor.run();
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
    if (this.getOption('auto-approve')) {
      return Promise.resolve(true);
    } else {
      return yesNoQuestion('Do you want to perform `destroy` action for components? (Y/N) ');
    }
  }
}

module.exports = DestroyCommand;
