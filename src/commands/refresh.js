'use strict';

const TerraformCommand = require('../terraform-command');

class RefreshCommand extends TerraformCommand {
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
    console.log('object', this.getOption('object'));
    console.log('array', this.getOption('array'));
    console.log('force', this.getOption('force'));

    console.log('var', this.getVars());
    console.log('var-file', this.getVarFiles());

    return Promise.resolve('Done');
  }
}

module.exports = RefreshCommand;
