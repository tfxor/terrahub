'use strict';

const TerraformPlanParser = require('./plan');
const TerraformApplyParser = require('./apply');
// const TerraformDestroyParser = require('./destroy');
const ServicesNames = require('./mapping/services-names');

class TerraformParsers {
  /**
   * Constructor
   * @param {String} mode - plan || apply || destroy
   * @param {String} rawContent
   * @param {Boolean} isHcl2
   */
  constructor(mode, rawContent, isHcl2) {
    this._mode = mode;
    this._isHcl2 = isHcl2;
    this._rawContent = rawContent;
  }

  /**
   * Parse
   * @returns {{listings: ([]|*[]), resources: ([]|*[])}}
   */
  parse() {
    switch (this._mode) {
      case 'plan':
        return new TerraformPlanParser(this._isHcl2, this._rawContent, ServicesNames).parse();

      case 'apply':
        return new TerraformApplyParser(this._isHcl2, this._rawContent, ServicesNames, Date.now().toString()).parse();

      case 'destroy':
        return JSON.parse(this._rawContent);

      default:
        throw new Error(`Terraform parse mode ${this._mode} is invalid. Valid: [plan, apply, destroy].`);
    }
  }
}

module.exports = TerraformParsers;
