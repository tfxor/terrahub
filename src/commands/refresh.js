'use strict';

const TerraformCommand = require('../terraform-command');

class RefreshCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'refresh';
  }

  static get description() {
    return 'Refresh command';
  }

  static get options() {
    return super.options
      .addOption('array', 'a', 'Some array', Array, [])
      .addOption('object', 'o', 'Some object', Object, {})
      .addOption('force', 'f', 'Replace directory', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  run() {
    console.log('object', this.getOption('object'));
    console.log('array', this.getOption('array'));
    console.log('force', this.getOption('force'));

    console.log('var', this.getVar());
    console.log('var-file', this.getVarFile());

    return Promise.resolve('Done');
  }
}

module.exports = RefreshCommand;
