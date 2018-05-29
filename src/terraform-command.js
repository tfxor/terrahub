'use strict';

const AbstractCommand = require('./abstract-command');

class TerraformCommand extends AbstractCommand {

  // @todo add --include option
  // configure() {}

  /**
   * @returns {Promise}
   */
  validate() {
    return super.validate().then(() => {
      if (!this._configLoader.isProjectConfigured()) {
        this.logger.info('Configuration file not found, please go to project root folder, or initialize it');
      } else if (this._configLoader.componentsCount() === 0) {
        this.logger.info('No configured components found, please create from template or configure existing');
      }
    });
  }
}

module.exports = TerraformCommand;
