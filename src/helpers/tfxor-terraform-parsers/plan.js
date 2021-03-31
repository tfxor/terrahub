'use strict';

const HCL = require('./plan-helper/hcl');
const HCL2 = require('./plan-helper/hcl2');

class TerraformPlanParser {
  /**
   * Constructor
   * @param {Boolean} isHcl2
   * @param {String} rawContent
   * @param {Object} servicesNames
   */
  constructor(isHcl2, rawContent, servicesNames) {
    this._isHcl2 = isHcl2;
    this._rawContent = rawContent;
    this._servicesNames = servicesNames;
  }

  /**
   * Parse
   * @returns {Object} {listings: []|Object[], resources: Object[]}
   */
  parse() {
    return this._isHcl2 === true
      ? new HCL2(this._servicesNames, this._rawContent).parse()
      : new HCL(this._servicesNames, this._rawContent).parse();
  }
}

module.exports = TerraformPlanParser;
