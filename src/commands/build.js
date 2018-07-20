'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class BuildCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('build')
      .setDescription('build software from predefined build.yml config files')
    ;
  }

  /**
   * @return {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(config, { worker: 'build-worker.js' });

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = BuildCommand;
