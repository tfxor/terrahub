'use strict';

const { fetch } = require('../parameters');
const TerraformCommand = require('../terraform-command');

class RefreshCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('refresh')
      .setDescription('run `terraform refresh` across multiple terrahub components [Not Implemented Yet]')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    console.log(JSON.stringify(this.getConfig(), null, 2));

    return fetch
      .get('code/webhook/update')
      .then(res => res.json())
      .then(json => {
        console.log('JSON', json);

        return Promise.resolve('Done');
      })
    ;
  }
}

module.exports = RefreshCommand;
