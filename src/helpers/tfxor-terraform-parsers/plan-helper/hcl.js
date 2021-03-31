'use strict';

const planParser = require('terraform-plan-parser');
const DotAccessor = require('../helper/dot-accessor');
const AbstractHCL = require('../abstract/abstract-hcl');

class HCL extends AbstractHCL {
  /**
   * Constructor
   * @param {Object} servicesName
   * @param {String} rawContent
   */
  constructor(servicesName, rawContent) {
    super(false);

    this._rawContent = rawContent;
    this._servicesName = servicesName;
  }

  /**
   * Parse
   * @returns {Object} {{listings: []|Object[], resources: Object[]}}
   */
  parse() {
    const plan = planParser.parseStdout(this._rawContent);

    return this._hclParsing(plan);
  }

  /**
   * Plan parsing for HCL1
   * @param {Object} plan
   * @returns {Object} {{listings: []|Object[], resources: Object[]}}
   * @private
   */
  _hclParsing(plan) {
    const resources = [];

    plan.changedResources.forEach((data) => {
      const resource = new DotAccessor(data);

      const type = resource.get('type');
      const resource_name = resource.get('name') || this._getChangedAttribute(resource, 'bucket');
      const slug = `${type}.${resource_name}`;
      const region = this._getChangedAttribute(resource, 'region') || 'n/a';
      const service_name = this._servicesName[type];

      const metadata = {};
      Object.keys(resource.get('changedAttributes')).forEach((key) => {
        const value = this._getChangedAttribute(resource, key);

        if (value && key !== 'region' && key !== 'bucket') {
          metadata[key] = value;
        }
      });

      const resourceInfo = {
        slug,
        type,
        region, // Updated also in parse-apply
        metadata,
        service_name,
        resource_name
        // Lineage - get with apply
        // Serial - get with apply
        // Identifier: - get with apply,
        // CloudAccountId - get with apply,
        // ResourceType - mapping?,
        // ResourceTimestamp - get with apply,
        // Provider - (must be mapped),
      };

      resources.push({ ...resourceInfo });
    });

    return { listings: [], resources };
  }

  /**
   * Get changed attribute value (for HCL1 only)
   * @param {DotAccessor} resource
   * @param {String} attribute
   * @returns {*}
   * @private
   */
  _getChangedAttribute(resource, attribute) {
    let result;

    try {
      result = resource.get('changedAttributes')[attribute].new.value;
    } catch (error) {
      // @todo: temporary disabled
      // if (!['region'].includes(attribute)) {
      //   error.message = `Failed to get resource.changed_attributes.${attribute}.new.value ` +
      //     `for '${resource.get('type')} resource type.'`;
      //   this.sendErrorToSentry(error);
      // }
    }

    return result;
  }
}

module.exports = HCL;
