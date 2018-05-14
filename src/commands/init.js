'use strict';

const Terraform = require('../helpers/terraform');
const AbstractCommand = require('../abstract-command');

class InitCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('init')
      .setDescription('Run `terraform init` across multiple terraform scripts')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    let cfg = this.getConfig()['Li9kMS9kMy9kNA=='];

    let tf = new Terraform(cfg);

    return tf
      .prepare()
      .then(() => Promise.resolve('Done'));
  }

}

module.exports = InitCommand;
