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
    this.warnExecutionStarted(config);

    return [{ actions: ['build'], config, format: format, postActionFn: (format) => !['json'].includes(format) ? 'Done' : '' }];
  }
}

module.exports = BuildCommand;
