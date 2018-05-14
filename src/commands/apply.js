'use strict';

const Terraform = require('../helpers/terraform');
const AbstractCommand = require('../abstract-command');

class ApplyCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('apply')
      .setDescription('Run `terraform apply` across multiple terraform scripts')
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
      .then(() => tf.apply())
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = ApplyCommand;
