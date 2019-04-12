'use strict';

const TerraformCommand = require('../terraform-command');
const { buildTmpPath } = require('../helpers/jit-helper');
const Distributor = require('../helpers/distributors/thread-distributor');

class PrepareCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('prepare')
      .setDescription('run `terraform prepare` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);
    const silent = this.getOption('silent');

    if (!silent) {
      const firstKey = Object.keys(config)[0];

      this.logger.log(buildTmpPath(config[firstKey]));
    }

    return distributor.runActions(['prepare'], { silent }).then(() => Promise.resolve('Done'));
  }
}

module.exports = PrepareCommand;
