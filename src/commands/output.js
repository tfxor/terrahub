'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { yesNoQuestion } = require('../helpers/util');

class OutputCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('output')
      .setDescription('run `terraform output` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this.logger.warn('This command makes sense only after apply command, and configured outputs');

    return yesNoQuestion('Do you want to run it (Y/N)? ').then(confirmed => {
      if (!confirmed) {
        return Promise.resolve('Canceled');
      }

      const config = this.getConfigTree();
      const distributor = new Distributor(config, { env: this.buildEnv(['prepare', 'output']) });

      return distributor
        .run()
        .then(() => Promise.resolve('Done'));
    });
  }
}

module.exports = OutputCommand;
