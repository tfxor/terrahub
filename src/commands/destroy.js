'use strict';

const Terraform = require('../helpers/terraform');
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
    let cfg = this.getConfig()['Li9kMS9kMy9kNA=='];
    let tf = new Terraform(cfg);

    return tf
      .prepare()
      .then(() => tf.destroy())
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = DestroyCommand;
