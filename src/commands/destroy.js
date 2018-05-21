'use strict';

const Distributor = require('../helpers/distributor');
const AbstractCommand = require('../abstract-command');

class DestroyCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('destroy')
      .setDescription('Run `terraform destroy` across multiple terraform scripts')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(['prepare', 'destroy'], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = DestroyCommand;
