'use strict';

const DistributedCommand = require('../distributed-command');

class BuildCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('build')
      .setDescription('build code used by terraform configuration (e.g. AWS Lambda, Google Functions)')
      .addOption('format', 'o', 'Log only the command result in one of the following formats: json, text', String, '')
    ;
  }

  /**
   * @return {Promise}
   */
  async run() {
    const format = this.getOption('format');

    if (format && !['json', 'text'].includes(format)) {
      return Promise.reject(new Error(`The '${format}' output format is not supported for this command.`));
    }

    const config = this.getFilteredConfig();
    // const distributor = new Distributor(config, this.runId);

    this.warnExecutionStarted(config);
    debugger;
    return [{ actions: ['build'], config, format: format, postActionFn: (format) => !['json'].includes(format) ? 'Done' : '' }];

    // return distributor.runActions(['build'], { format: format })
    //   .then(() => Promise.resolve(!['json'].includes(format) ? 'Done' : ''))
    //   .catch(err => ['json'].includes(format) ? Promise.resolve() : Promise.reject(err));
  }
}

module.exports = BuildCommand;
