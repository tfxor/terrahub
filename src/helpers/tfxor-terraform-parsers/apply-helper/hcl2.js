'use strict';


const State = require('../mapping/state');
const AbstractHCL = require('../abstract/abstract-hcl');
const DotAccessor = require('../helper/dot-accessor');

class HCL2 extends AbstractHCL {
  /**
   * Constructor
   * @param {Object} servicesName
   * @param {String} rawContent
   * @param {String} lastModifiedTime
   */
  constructor(servicesName, rawContent, lastModifiedTime) {
    super(true);

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

    stateAsJson.resources.forEach((resource) => {
      const resourceAsDot = new DotAccessor(resource, State.dotAccessorConfig.separator);

      const { type, slug } = this._parseTypeNameSlug(resourceAsDot);
      const provider = this.parseProvider(resourceAsDot.get('provider'));
      if (provider === undefined) {
        throw new Error(`Invalid terraform provider ${resourceAsDot.get('provider')}`);
      }

      const instances = resourceAsDot.get('instances');
      instances.forEach((instance) => {
        const metadata = instance.attributes;
        const serviceName = this._servicesName[type] || type;
        const identifier = this.parseIdentifier(provider, instance);
        const region = this.parseRegion(provider, instance) || 'n/a';
        const resourceName = this.parseResourceName(provider, instance);
        const cloudAccountId = this.parseCloudAccountId(provider, instance) || 'n/a';
        const resourceTimestamp = this.parseResourceTimestamp(provider, instance) || this._lastModifiedTime;

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
      const instances = dataSourceAsDot.get('instances');

      instances.forEach((instance) => {
        const region = this.parseRegion(provider, instance) || null;
        const cloudAccountId = this.parseCloudAccountId(provider, instance) || null;

        if (region !== null) {
          dataParsed[fullnameProvider].regions.push(region);
        }
        if (cloudAccountId !== null) {
          dataParsed[fullnameProvider].cloudAccountIds.push(cloudAccountId);
        }
      });
    });

    Object.keys(dataParsed).forEach((fullnameProvider) => {
      const isValid = this._checkDataSourcesAccountsRegions(dataParsed, fullnameProvider);

      listings.forEach((listing) => {
        if (listing.fullname_provider === fullnameProvider) {
          if (isValid.useCloudAccountIds === true && listing.cloud_account_id === 'n/a') {
            listing.cloud_account_id = dataParsed[fullnameProvider].cloudAccountIds[0];
          }
          if (isValid.useRegions === true && listing.region === 'n/a') {
            listing.region = dataParsed[fullnameProvider].regions[0];
          }
        }
      });
      resources.forEach((resource) => {
        if (resource.fullname_provider === fullnameProvider) {
          if (isValid.useCloudAccountIds === true && resource.cloud_account_id === 'n/a') {
            resource.cloud_account_id = dataParsed[fullnameProvider].cloudAccountIds[0];
          }
          if (isValid.useRegions === true && resource.region === 'n/a') {
            resource.region = dataParsed[fullnameProvider].regions[0];
          }
        }
      });
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
   * Parse resource type, name and slug
   * @param {DotAccessor} resourceAsDot
   * @return {{name: String, type: String, slug: String}}
   * @private
   */
  _parseTypeNameSlug(resourceAsDot) {
    const type = resourceAsDot.get('type');
    const name = resourceAsDot.get('name');
    return { type, name, slug: `${type}.${name}` };
  }

  /**
   * Clean terraform state json
   * @param {Object} stateAsJson
   * @returns {Object} {{
   *   version: Number,
   *   terraform_version: String,
   *   serial: Number,
   *   lineage: String,
   *   resources: Object[]
   *   data: Object[]
   * }}
   * @private
   */
  _cleanStateJson(stateAsJson) {
    const cleanedStateAsJson = stateAsJson;
    const data = stateAsJson.resources !== undefined
      ? stateAsJson.resources.filter(
        (resource) => resource.mode === 'data' && !State.excludedDataSources.includes(resource.type)
      ) : [] ;
    const resources = stateAsJson.resources !== undefined
      ? stateAsJson.resources.filter((resource) => resource.mode === 'managed') : [];

    delete cleanedStateAsJson.outputs;

    cleanedStateAsJson.data = data;
    cleanedStateAsJson.resources = resources;

    return cleanedStateAsJson;
  }

  /**
   * Check if data for provider is valid for use from data_sources
   * @param {Object} dataParsed
   * @param {String} provider
   * @returns {{
   *   useRegions: Boolean,
   *   useCloudAccountIds: Boolean
   * }}
   * @private
   */
  _checkDataSourcesAccountsRegions(dataParsed, provider) {
    const regionReference = dataParsed[provider].regions[0];
    const cloudAccountIdReference = dataParsed[provider].cloudAccountIds[0];

    return {
      useRegions: dataParsed[provider].regions.every((region) => region === regionReference),
      useCloudAccountIds: dataParsed[provider].cloudAccountIds.every(
        (cloudAccountId) => cloudAccountId === cloudAccountIdReference
      )
    };
  }
}

module.exports = HCL2;
