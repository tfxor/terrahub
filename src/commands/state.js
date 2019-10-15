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
      .addOption('list', 'L', 'List resources in the state', Boolean, false)
      .addOption('delete', 'D', 'Remove instances from the state', Array, [])
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = new Distributor(config, this.runId);
    this._list = this.getOption('list')
    this._delete = this.getOption('delete');

    if (this._delete.length > 0 && this._list) {
      return Promise.reject(new Error(`Resource specification must include a resource type and name.`));
    }

    if (this._delete.length == 0 && this._list) {
      return distributor
      .runActions(['prepare', 'init', 'workspaceSelect', 'stateList'], {
        stateList: this._list
      }).then(() => Promise.resolve('Done'));
    }

    return Promise.all(
      this._delete.map(it => {

        return distributor
          .runActions(['prepare', 'init', 'workspaceSelect', 'stateDelete'], {
            stateDelete: it
          }).then(() => 'Done');
      })
    );
  }
}

module.exports = StateCommand;
