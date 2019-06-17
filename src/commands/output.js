'use strict';

const { yesNoQuestion } = require('../helpers/util');
const TerraformCommand = require('../terraform-command');
const Distributor = require('../helpers/distributors/thread-distributor');

class OutputCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('output')
      .setDescription('run `terraform output` across multiple terrahub components')
      .addOption('format', 'o', 'Specify the output format (text or json)', String, '')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this._format = this.getOption('format');

    if (!['text', 'json', ''].includes(this._format)) {
      return Promise.reject(new Error(`The '${this._format}' output format is not supported for this command.`));
    }

    return this._getPromise().then(isConfirmed => {
      if (!isConfirmed) {
        return Promise.resolve('Action aborted');
      }

      const config = this.getFilteredConfig();
      const distributor = new Distributor(config, this.runId);

      return distributor.runActions(['prepare', 'output'], {
        format: this._format
      });
    }).then(results => {
      this._handleOutput(results);

      return this._format ? Promise.resolve() : Promise.resolve('Done');
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  _getPromise() {
    if (!this._format || this.getOption('auto-approve')) {
      return Promise.resolve(true);
    } else {
      this.logger.warn('This command makes sense only after apply command, and configured outputs');

      return yesNoQuestion('Do you want to run it (y/N)? ');
    }
  }

  /**
   * Prints the output data for the 'output' command
   * @param {Object[]} results
   * @private
   */
  _handleOutput(results) {
    switch (this._format) {
      case 'json':
        const result = {};

        results.forEach(it => {
          const stdout = (Buffer.from(it.buffer)).toString('utf8');
          const indexStart = stdout.indexOf('{');
          const json = stdout[0] !== '{' ? stdout.substring(indexStart, stdout.length) : stdout;
          
          result[it.component] = JSON.parse(json);
        });

        this.logger.raw(JSON.stringify(result));
    }
  }
}

module.exports = OutputCommand;
