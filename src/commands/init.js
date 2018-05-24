'use strict';

const Distributor = require('../helpers/distributor');
const AbstractCommand = require('../abstract-command');

class InitCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('init')
      .setDescription('Run `terraform init` across multiple terraform scripts')
      // .addOption('include', 'i', 'Run only selected modules', false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(['prepare', 'init'], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = InitCommand;
