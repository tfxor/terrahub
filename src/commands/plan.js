'use strict';

const Terraform = require('../helpers/terraform');
const AbstractCommand = require('../abstract-command');

class PlanCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('plan')
      .setDescription('Run `terraform plan` across multiple terraform scripts')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    let cfg = this.getConfig()['Li9kMS9kMy9kNA=='];

    // console.log(JSON.stringify(cfg, null, 2));

    let tf = new Terraform(cfg);

    return tf
      .prepare()
      .then(() => tf.plan())
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = PlanCommand;
