'use strict';

const TerraformCommand = require('../terraform-command');
const Distributor = require('../helpers/distributors/thread-distributor');

class StateCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('state')
      .setDescription('run `terraform state` across multiple terrahub components')
      .addOption('list', 'l', 'List resources in the state', Boolean, false)
      .addOption('rm', 'r', 'Remove instances from the state', Array, [])
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = new Distributor(config, this.runId);
    this._list = this.getOption('list')
    this._rm = this.getOption('rm');

    if (this._rm.length > 0 && this._list) {
      return Promise.reject(new Error(`Resource specification must include a resource type and name.`));
    }

    if (this._rm.length == 0 && this._list) {
      return distributor
      .runActions(['prepare', 'init', 'workspaceSelect', 'stateList'], {
        stateList: this._list
      }).then(() => Promise.resolve('Done'));
    }

    return Promise.all(
      this._rm.map(it => {

        return distributor
          .runActions(['prepare', 'init', 'workspaceSelect', 'stateRm'], {
            stateRm: it
          }).then(() => 'Done');
      })
    );
  }
}

module.exports = StateCommand;
