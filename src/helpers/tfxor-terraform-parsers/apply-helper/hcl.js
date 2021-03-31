'use strict';

const State = require('../mapping/state');
const AbstractHCL = require('../abstract/abstract-hcl');
const DotAccessor = require('../helper/dot-accessor');

class HCL extends AbstractHCL {
  /**
   * Constructor
   * @param {Object} servicesName
   * @param {String} rawContent
   * @param {String} lastModifiedTime
   */
  constructor(servicesName, rawContent, lastModifiedTime) {
    super(false);

    this._rawContent = rawContent;
    this._servicesName = servicesName;
    this._lastModifiedTime = lastModifiedTime;

    this._globalInfo = { lineage: null, serial: null, terraformVersion: null };
  }

  /**
   * Parse
   * @returns {Object} {{listings: []|Object[], resources: Object[]}}
   */
  parse() {
    const listings = [];
    const resources = [];
    const dataParsed = {};
    const stateAsJson = this._cleanStateJson(JSON.parse(this._rawContent));

    this._parseGlobalInfo(stateAsJson);

    stateAsJson.modules.forEach((module) => {
      const { resources: resourceObj } = module;

      Object.keys(resourceObj).forEach((resourceKey) => {
        const resourceAsDot = new DotAccessor(resourceObj[resourceKey], State.dotAccessorConfig.separator);

        const slug = resourceKey;
        const type = resourceAsDot.get('type');

        const provider = this.parseProvider(resourceAsDot.get('provider'));
        if (provider === undefined) {
          throw new Error(`Invalid terraform provider ${resourceAsDot.get('provider')}`);
        }

        const metadata = resourceAsDot.get('primary**attributes');
        const serviceName = this._servicesName[type] || type;
        const identifier = this.parseIdentifier(provider, resourceObj[resourceKey]);
        const region = this.parseRegion(provider, resourceObj[resourceKey]) || 'n/a';
        const resourceName = this.parseResourceName(provider, resourceObj[resourceKey]);
        const cloudAccountId = this.parseCloudAccountId(provider, resourceObj[resourceKey]) || 'n/a';
        const resourceTimestamp = this.parseResourceTimestamp(
          provider, resourceObj[resourceKey]
        ) || this._lastModifiedTime;

        const listingInfo = {
          region,
          provider,
          identifier,
          fullname_provider: resourceAsDot.get('provider'),
          resourceType: type,
          serviceName,
          resourceName,
          providerAccount: cloudAccountId,
          slug,
          resourceTimestamp // required for listing table
        };
        const resourceInfo = { slug, type, metadata };

        listings.push(listingInfo);
        resources.push({ ...this._globalInfo, ...listingInfo, ...resourceInfo });
      });
    });
    stateAsJson.data.forEach((dataSource) => {
      const dataSourceAsDot = new DotAccessor(dataSource);

      const fullnameProvider = dataSourceAsDot.get('provider');
      const provider = this.parseProvider(fullnameProvider);
      if (provider === undefined) {
        throw new Error(`Invalid terraform provider ${dataSourceAsDot.get('provider')}`);
      }

      dataParsed[fullnameProvider] = {};
      dataParsed[fullnameProvider].regions = [];
      dataParsed[fullnameProvider].cloudAccountIds = [];

      const region = this.parseRegion(provider, dataSource) || null;
      const cloudAccountId = this.parseCloudAccountId(provider, dataSource) || null;

      if (region !== null) {
        dataParsed[fullnameProvider].regions.push(region);
      }
      if (cloudAccountId !== null) {
        dataParsed[fullnameProvider].cloudAccountIds.push(cloudAccountId);
      }
    });

    return { listings, resources };
  }

  /**
   * Parse global info (lineage, serial and terraform_version)
   * @param {Object} stateAsJson
   * @private
   */
  _parseGlobalInfo(stateAsJson) {
    ({
      lineage: this._globalInfo.lineage,
      serial: this._globalInfo.serial,
      terraformVersion: this._globalInfo.terraform_version
    } = stateAsJson);
  }

  /**
   * Clean terraform state json
   * @param {Object} stateAsJson
   * @returns {{
   *   version: Number,
   *   terraform_version: String,
   *   serial: Number,
   *   lineage: String,
   *   modules: {resources: Object}[]
   * }}
   * @private
   */
  _cleanStateJson(stateAsJson) {
    const data = [];
    const cleanedStateAsJson = stateAsJson;

    cleanedStateAsJson.modules.forEach((item) => {
      delete item.path;
      delete item.outputs;

      Object.keys(item.resources).forEach((key) => {
        if (key.split('.')[0] === 'data') {
          if (!State.excludedDataSources.includes(item.resources[key].type)) {
            data.push(item.resources[key]);
          }
          delete item.resources[key];
        }
      });
    });
    cleanedStateAsJson.data = data;

    return cleanedStateAsJson;
  }
}

module.exports = HCL;
