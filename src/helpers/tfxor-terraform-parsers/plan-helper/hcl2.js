'use strict';

const Regions = require('../mapping/regions');
const DotAccessor = require('../helper/dot-accessor');
const AbstractHCL = require('../abstract/abstract-hcl');

class HCL2 extends AbstractHCL {
  /**
   * Constructor
   * @param {Object} servicesName
   * @param {String} rawContent
   */
  constructor(servicesName, rawContent) {
    super(true);

    this._rawContent = rawContent;
    this._servicesName = servicesName;
  }

  /**
   * Parse
   * @returns {Object} {{listings: []|Object[], resources: Object[]}}
   */
  parse() {
    return this._hcl2Parsing(JSON.parse(this._rawContent));
  }

  /**
   * Plan parsing for HCL2
   * @param {Object} plan - https://www.terraform.io/docs/internals/json-format.html#plan-representation
   * @returns {Object} {{listings: []|Object[], resources: Object[]}}
   * @private
   */
  _hcl2Parsing(plan) {
    const planDot = new DotAccessor(plan, '**');
    const resources = [];

    const planResources = planDot.get('planned_values**root_module**resources');

    if (planResources) {
      planResources.forEach((resource) => {
        const resourceDot = new DotAccessor(resource);

        const metadata = resource.values;
        const type = resourceDot.get('type');
        const resource_name = resourceDot.get('name');
        const slug = `${type}.${resource_name}`;

        const provider = this._getProvider(resourceDot.get('provider_name'));
        const cloudAccountId = this.parseCloudAccountId(provider, { attributes: resource.values }) || 'n/a';

        const service_name = this._servicesName[type];
        let region = this._getRegionFromProvider(provider, planDot);

        // Check one more time for region value
        if (region === 'n/a') {
          region = this._getRegionFromResourceValues(resource.values, provider);
        }

        const resourceInfo = {
          slug,
          type,
          region, // Updated also in parse-apply
          metadata,
          service_name,
          resource_name,
          providerAccount: cloudAccountId,
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
    }

    return { listings: [], resources };
  }

  /**
   * Get region used in provider
   * @param {String} provider
   * @param {DotAccessor} planDot
   * @returns {String|null}
   * @private
   */
  _getRegionFromProvider(provider, planDot) {
    let region = null;
    const providerConfig = planDot.get('configuration**provider_config');

    Object.keys(providerConfig).forEach((key) => {
      if (key === provider) {
        region = planDot.get(`configuration**provider_config**${provider}**expressions**region**constant_value`);
      }
    });

    return region || 'n/a';
  }

  /**
   * Get region from resource's values
   * @param {Object} values
   * @param {Object} provider
   * @returns {String}
   * @private
   */
  _getRegionFromResourceValues(values, provider) {
    let region = null;
    let newProvider = provider;
    const allRegions = Regions[newProvider];
    newProvider = this._getProvider(newProvider);
    switch (newProvider) {
      case 'aws':
        Object.keys(values).forEach((key) => {
          if (key.includes('arn')) {
            allRegions.forEach((it) => {
              if (values[key] !== null && values[key].includes(it)) {
                region = it;
              }
            });
          }
        });
        break;
      case 'gcp':
        break; // @todo
      case 'azurerm':
        break; // @todo
      default:
        return 'n/a';
    }

    return region || 'n/a';
  }

  /**
   * Get provider
   * @param {String} provider
   * @returns {String}
   */
  _getProvider(provider) {
    if (!provider) {
      return 'n/a';
    }

    const reResult = provider.match(new RegExp('aws|gcp|azurerm'));
    if (reResult) {
      return reResult[0];
    }

    return 'n/a';
  }
}

module.exports = HCL2;
