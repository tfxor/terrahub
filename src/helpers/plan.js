'use strict';

const Metadata = require('./metadata');

class Plan extends Metadata {
  /**
   * Init
   * @desc check if workspace dir exists
   */
  init() {
    this.reBase();
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'terraform.tfplan';
  }
}

module.exports = Plan;
