'use strict';

const fs = require('fs');
const path = require('path');
const State = require('./state');

/**
 * Terraform plan
 */
class Plan {
  /**
   * @param {String} baseDir
   */
  constructor(baseDir) {
    this._base = baseDir;
  }

  /**
   * @returns {String}
   * @private
   */
  _path() {
    return path.join(this.getBase(), Plan.NAME);
  }

  /**
   * @todo investigate if we need this in Plan
   * @param {String} workspace
   */
  refresh(workspace) {
    let stateDir = path.join(this._base, State.DIR);

    if (fs.existsSync(stateDir)) {
      this._base = `${stateDir}/${workspace}`;
    }
  }

  /**
   * @returns {String}
   */
  getBase() {
    return this._base;
  }

  /**
   * @returns {String}
   */
  getPath() {
    return this._path();
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'terraform.tfplan';
  }
}

module.exports = Plan;
