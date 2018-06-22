'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class RunCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'run';
  }

  static get description() {
    return 'run automated workflow terraform init > workspace > plan > apply > destroy';
  }

  static get options() {
    return super.options
      .addOption('plan', 'p', 'Run plan', Boolean, true)
      .addOption('apply', 'a', 'Run apply', Boolean, false)
      .addOption('destroy', 'd', 'Run destroy', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const actions = ['plan', 'apply', 'destroy'].filter(action => this.getOption(action));
    const distributor = new Distributor(['prepare', 'init', 'workspace', ...actions], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = RunCommand;
