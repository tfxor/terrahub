'use strict';

const AbstractCommand = require('../abstract-command');

class RefreshCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('refresh')
      .setDescription('Refresh command')
      .addOption('array', 'a', 'Some array', Array, [])
      .addOption('object', 'o', 'Some object', Object, {})
      .addOption('force', 'f', 'Replace directory', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    console.log(this.getOption('object'));
    console.log(this.getOption('array'));
    console.log(this.getOption('force'));

    return Promise.resolve('Done');
  }
}

module.exports = RefreshCommand;
