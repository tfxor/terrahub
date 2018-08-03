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
      .addOption('output', 'o', 'Log only the command result in one of the following formats: json, text', String, '')
    ;
  }

  /**
   * @return {Promise}
   */
  run() {
    const output = this.getOption('output');
    const silent = this.getOption('silent');

    if (output && !['json', 'text'].includes(output)) {
      return Promise.reject(new Error(`The '${output}' output format is not supported for this command.`));
    }

    const config = this.getConfigTree();
    const distributor = new Distributor(config, {
      worker: 'build-worker.js',
      env: {
        silent: silent,
        output: output
      }
    });

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = BuildCommand;
