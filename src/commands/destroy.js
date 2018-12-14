'use strict';

const Dictionary = require("../helpers/dictionary");
const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { askForApprovement } = require('../helpers/util');

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
    return this.getEnvVarsFromAPI().then(data => this.getExtendedProcessEnv(data)).then(() => {
      return this.checkDependencies(config, Dictionary.DIRECTION.REVERSE)
        .then(() => this._getPromise())
        .then(answer => answer ?
          distributor.runActions(['prepare', 'workspaceSelect', 'plan', 'destroy'], {
            silent: this.getOption('silent'),
            planDestroy: true,
            dependencyDirection: Dictionary.DIRECTION.REVERSE
          }) : Promise.reject('Action aborted')
        ).then(() => Promise.resolve('Done'));
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  _getPromise() {
    if (this.getOption('auto-approve')) {
      return Promise.resolve(true);
    } else {
      return askForApprovement(this.getConfigObject(), 'destroy', this.getProjectConfig);
    }
  }
}

module.exports = DestroyCommand;
