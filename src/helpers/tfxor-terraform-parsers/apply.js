'use strict';

const HCL = require('./apply-helper/hcl');
const HCL2 = require('./apply-helper/hcl2');

class TerraformApplyParser {
  /**
   * Constructor
   * @param {Boolean} isHcl2
   * @param {String} rawContent
   * @param {Object} servicesNames
   * @param {String} lastModifiedTime
   */
  constructor(isHcl2, rawContent, servicesNames, lastModifiedTime) {
    this._isHcl2 = isHcl2;
    this._rawContent = rawContent;
    this._servicesNames = servicesNames;
    this._lastModifiedTime = lastModifiedTime;
  }

  /**
   * Parse
   * @returns {Object} {listings: []|Object[], resources: Object[]}
   */
  parse() {
    return this._isHcl2 === true
      ? new HCL2(this._servicesNames, this._rawContent, this._lastModifiedTime).parse()
      : new HCL(this._servicesNames, this._rawContent, this._lastModifiedTime).parse();
  }
}

module.exports = TerraformApplyParser;
