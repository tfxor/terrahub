'use strict';

const Distributor = require('../helpers/distributor');
const AbstractCommand = require('../abstract-command');

class WorkspaceCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('workspace')
      .setDescription('Run `terraform workspace` across multiple terraform scripts')
    ;
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
