'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class WorkspaceCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'workspace';
  }

  static get description() {
    return 'Run `terraform workspace` across multiple terraform scripts';
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(['prepare', 'workspace'], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = WorkspaceCommand;
