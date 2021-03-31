'use strict';

const State = require('../mapping/state');
const Moment = require('../helper/moment');
const Regions = require('../mapping/regions');
const DotAccessor = require('../helper/dot-accessor');
const Terraform = require('../mapping/terraform-providers');

/**
 * @abstract
 */
class AbstractHCL {
  /**
   * Constructor
   * @param {Boolean} isHcl2
   */
  constructor(isHcl2) {
    this._parseStateMapping = isHcl2 === true ? State.hcl2 : State.hcl;
  }

  /**
   * Parse provider - expected input is `provider.[name]`
   * @param {String} rawProvider
   * @returns {String}
   */
  parseProvider(rawProvider) {
    if (rawProvider.includes('.') && rawProvider.includes('/')) {
      const reResult = rawProvider.match(new RegExp('aws|gcp|azurerm'));
      if (reResult) {
        return reResult[0];
      }

      return 'n/a';
    }

    const splittedProvider = rawProvider.split('.');

    return Terraform.providers.find(
      (validTerraformProvider) => validTerraformProvider === splittedProvider[1]
    );
  }

  /**
   * Parse resource identifier
   * @param {String} provider
   * @param {Object} resourceInstance
   * @returns {String}
   */
  parseIdentifier(provider, resourceInstance) {
    const config = this._parseStateMapping[provider].default.identifier;
    const resourceInstanceAsDot = new DotAccessor(resourceInstance, State.dotAccessorConfig.separator);

    const ids = [];
    switch (config.action) {
      case 'value':
        config.targets.forEach((target) => ids.push(resourceInstanceAsDot.get(target)));
        break;

      default:
        throw new Error(`Unknown action ${config.action} for parsing identifier.`);
    }

    return ids.find((id) => id !== undefined);
  }

  /**
   * Parse cloud account
   * @param {String} provider
   * @param {Object} resourceInstance
   * @returns {String}
   */
  parseCloudAccountId(provider, resourceInstance) {
    const config = this._parseStateMapping[provider].default.cloud_account_id;
    const resourceInstanceAsDot = new DotAccessor(resourceInstance, State.dotAccessorConfig.separator);

    const cloudAccountIds = [];
    switch (config.action) {
      case 'regexp':
        config.targets.forEach((target) => {
          const regExp = new RegExp(config.regexp);
          const source = resourceInstanceAsDot.get(target);

          const res = regExp.exec(source);
          if (res) {
            cloudAccountIds.push(res.find((it) => regExp.test(it)));
          }
        });
        break;

      case 'value':
        config.targets.forEach((target) => cloudAccountIds.push(resourceInstanceAsDot.get(target)));
        break;

      case 'none':
        return 'n/a';

      default:
        throw new Error(`Unknown action ${config.action} for parsing cloud account.`);
    }

    return cloudAccountIds.find((cloudAccountId) => cloudAccountId !== undefined);
  }

  /**
   * Parse region or location
   * @param {String} provider
   * @param {Object} resourceInstance
   * @returns {String}
   */
  parseRegion(provider, resourceInstance) {
    const config = this._parseStateMapping[provider].default.region;
    const resourceInstanceAsDot = new DotAccessor(resourceInstance, State.dotAccessorConfig.separator);

    const regionsArr = [];
    switch (config.action) {
      case 'search':
        config.targets.forEach((target) => regionsArr.push(resourceInstanceAsDot.get(target)));
        break;

      case 'regexp_key':
        // eslint-disable-next-line no-case-declarations
        const regexp = new RegExp(config.regexp);
        config.targets.forEach((target) => {
          Object.keys(resourceInstanceAsDot.get(target)).forEach((key) => {
            if (regexp.test(key)) {
              return resourceInstanceAsDot.get(target)[key];
            }
          });
        });
        break;

      case 'none':
        return 'n/a';

      default:
        throw new Error(`Unknown action ${config.action} for parsing region or location.`);
    }

    let found = '';
    regionsArr
      .filter((item) => item !== undefined)
      .forEach((filtered) => {
        Regions[provider].forEach((valid) => {
          const regExp = new RegExp(valid);
          const match = filtered.match(regExp);

          if (match) {
            // eslint-disable-next-line prefer-destructuring
            found = match[0];
          }
        });
      });

    return found;
  }

  /**
   * Parse resource name
   * @param {String} provider
   * @param {Object} resourceInstance
   * @returns {String}
   */
  parseResourceName(provider, resourceInstance) {
    const config = this._parseStateMapping[provider].default.resource_name;
    const resourceInstanceAsDot = new DotAccessor(resourceInstance, State.dotAccessorConfig.separator);

    const resourceNames = [];
    switch (config.action) {
      case 'regexps_key':
        config.regexps.forEach((regexp) => {
          const regExp = new RegExp(regexp);
          config.targets.forEach((target) => {
            Object.keys(resourceInstanceAsDot.get(target)).forEach((key) => {
              if (regExp.test(key)) {
                resourceNames.push(resourceInstanceAsDot.get(target)[key]);
              }
            });
          });
        });
        break;

      default:
        throw new Error(`Unknown action ${config.action} for parsing resource name.`);
    }

    return resourceNames.find((resourceName) => resourceName);
  }

  /**
   *
   * @param {String} provider
   * @param {Object} resourceInstance
   * @returns {String}
   */
  parseResourceTimestamp(provider, resourceInstance) {
    const config = this._parseStateMapping[provider].default.resource_timestamp;
    const resourceInstanceAsDot = new DotAccessor(resourceInstance, State.dotAccessorConfig.separator);

    const resourceTimestamps = [];
    switch (config.action) {
      case 'regexps_key':
        config.regexps.forEach((regexp) => {
          const regExp = new RegExp(regexp);
          config.targets.forEach((target) => {
            Object.keys(resourceInstanceAsDot.get(target)).forEach((key) => {
              if (key.match(regExp)) {
                resourceTimestamps.push(Moment.toISOString(resourceInstanceAsDot.get(target)[key]));
              }
            });
          });
        });
        break;

      default:
        throw new Error(`Unknown action ${config.action} for parsing resource timestamp.`);
    }

    return resourceTimestamps.find((region) => region !== undefined);
  }
}

module.exports = AbstractHCL;
