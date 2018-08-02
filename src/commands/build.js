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
      .setDescription('build code used by terraform configuration (e.g. AWS Lambda, Google Functions)')
      .addOption('silent', 's', 'Runs the commands without console output', Boolean, false)
      .addOption('json', 'j', 'Output only build result in json format', Boolean, false)
    ;
  }

  /**
   * @return {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(config, {
      worker: 'build-worker.js',
      env: {
        silent: this.getOption('silent'),
        json: this.getOption('json')
      }
    });

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = BuildCommand;
