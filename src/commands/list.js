'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const fse = require('fs-extra');
const treeify = require('treeify');
const AbstractCommand = require('../abstract-command');

const HashTable = require('../helpers/hash-table');
const { toMd5, homePath} = require('../helpers/util');
const { fetch, config, templates } = require('../parameters');

class ListCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('list')
      .setDescription('list cloud resources by projects > accounts > regions > services > resources')
      .addOption(
        'depth', 'd', 'Listing depth (0 - projects, 1 - accounts, 2 - regions, 3 - services, 4 - resources)', Number, 0
      )
      .addOption('projects', 'p', 'Projects (comma separated values)', Array, [])
      .addOption('accounts', 'a', 'Accounts (comma separated values)', Array, [])
      .addOption('regions', 'r', 'Regions (comma separated values)', Array, [])
      .addOption('services', 's', 'Services (comma separated values)', Array, [])
    ;
  }

  /**
   * Init
   */
  initialize() {
    this.hash = new HashTable({}, ':');
    this.accountId = '';
    this.credentials = null;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const depth = this.getOption('depth');
    const regions = this.getOption('regions');
    const projects = this.getOption('projects');
    const accounts = this.getOption('accounts');
    const services = this.getOption('services');

    this.logger.warn('Querying cloud accounts, regions and services. It might take a while...');

    return this._getCredentials()
      .then(credentials => {
        const sts = new AWS.STS({ credentials });

        return sts.getCallerIdentity().promise();
      })
      .then(identity => {
        this.accountId = identity.Account;

        return this._fetchResources();
      })
      .then(data => {
        /**
         * @param {Array} allowed
         * @param {String} item
         * @returns {Boolean}
         */
        function isAllowed(allowed, item) {
          return (allowed.length === 0 || allowed.includes(item));
        }

        this.logger.log('Compiling the list of cloud resources. ' +
          'Use --depth, -d option to view details about projects, accounts, regions and services.' + os.EOL);

        data.forEach(item => {
          if (
            isAllowed(projects, item.project)
            && isAllowed(accounts, item.accountId)
            && isAllowed(regions, item.region)
            && isAllowed(services, item.service)
          ) {
            this.hash.set([item.project, item.accountId, item.region, item.service, item.resource].join(':'), null);
          }
        });

        return Promise.resolve();
      })
      .then(() => {
        this.logger.log('Projects');

        this._showTree(this._format(this.hash.getRaw(), 0, depth));

        this.logger.log('');
        this.logger.warn('Above list includes ONLY cloud resources that support tagging api.');
        this.logger.log('Please visit https://www.terrahub.io and register to see ALL cloud resources.');

        return Promise.resolve();
      })
      .then(() => Promise.resolve('Done'))
      .catch(err => {
        throw ['EAI_AGAIN', 'NetworkingError'].includes(err.code) ?
          new Error('TerraHub is missing internet connection') :
          err;
      });
  }

  /**
   * @param {Object} tree
   * @private
   */
  _showTree(tree) {
    // no resources if tree is empty
    treeify.asLines(tree, false, line => {
      this.logger.log(` ${line}`);
    });
  }

  /**
   * @param {Object} data
   * @param {Number} level
   * @param {Number} depth
   * @returns {Object}
   * @private
   */
  _format(data, level = 0, depth = 0) {
    const result = {};
    const titles = ['Project', 'Account', 'Region', 'Service', 'Resource'];
    const keys = Object.keys(data);

    keys.forEach((key, index) => {
      if (data[key] !== null && level !== depth) {
        result[`${key} (${titles[level]} ${index + 1} of ${keys.length})`] = this._format(data[key], level + 1, depth);
      } else {
        result[`${key} (${titles[level]} ${index + 1} of ${keys.length})`] = null;
      }
    });

    return result;
  }

  /**
   * Get Resources from AWS Tagging API
   * @returns {Promise}
   * @private
   */
  _getResourcesFromAwsApi() {
    return this._getCredentials()
      .then(credentials => {
        return Promise.all(
          this._getRegions().map(region => new AWS.ResourceGroupsTaggingAPI({ region, credentials }))
        );
      })
      .then(taggingApis => {
        return Promise.all(taggingApis.map(taggingApi => this._getResources(taggingApi))).then(data => {
          let result = [];
          data.forEach(item => result.push(...item));

          return result;
        });
      })
      .then(data => {
        const cachePath = this._cachePath(this.accountId);

        return fse.outputJson(cachePath, data).then(() => {
          return data;
        });
      });
  }

  /**
   * Get Resources from TerraHub API
   * @return {Promise|*}
   * @private
   */
  _getResourcesFromTerrahubApi() {
    if (!config.token) {
      return Promise.resolve([]);
    }

    return fetch.get('thub/listing/retrieve?type=list').then(json => {
      return json.data.map(row => {
        return {
          service: row.service_name,
          region: row.region,
          accountId: row.cloud_account_id,
          resource: row.resource_name,
          project: row.project_hash
        };
      });
    }).then(data => {
      const cachePath = this._cachePath(config.token);

      return fse.outputJson(cachePath, data).then(() => Promise.resolve(data));
    });
  }

  /**
   * Fetch all resources (Cache + AWS Tagging API + TerraHub API)
   * @return {Promise}
   * @private
   */
  _fetchResources() {
    return Promise.all(
      [this.accountId, config.token].map(salt => this._cachePath(salt)).map(cachePath => this._tryCache(cachePath))
    ).then(([free, paid]) => {
      return Promise.all([
        free ? free : this._getResourcesFromAwsApi(),
        paid ? paid : this._getResourcesFromTerrahubApi()
      ]).then(([free, paid]) => [...free, ...paid]);
    });
  }

  /**
   * Get cached results
   * @param {String} cachePath
   * @returns {Promise}
   * @private
   */
  _tryCache(cachePath) {
    if (!fs.existsSync(cachePath)) {
      return Promise.resolve();
    }

    const { birthtimeMs } = fs.statSync(cachePath);

    if (birthtimeMs + ListCommand.TTL > Date.now()) {
      return fse.readJSON(cachePath);
    }

    return fse.unlink(cachePath);
  }

  /**
   * @param {String} salt
   * @returns {String}
   * @private
   */
  _cachePath(salt) {
    return homePath('cache', 'list', `${toMd5('resources' + salt)}.json`);
  }

  /**
   * Get full list of resources
   * @param {ResourceGroupsTaggingAPI} taggingApi
   * @param {Object} params
   * @param {Array} data
   * @returns {Promise}
   * @private
   */
  _getResources(taggingApi, params = {}, data = []) {
    return taggingApi.getResources(params).promise().then(res => {
      const activeRegion = taggingApi.config.region;

      res.ResourceTagMappingList.forEach(res => {
        data.push(this._parseResource(res, activeRegion));
      });

      if (!res.PaginationToken) {
        return Promise.resolve(data);
      }

      return this._getResources(taggingApi, { PaginationToken: res.PaginationToken }, data);
    });
  }

  /**
   * @param {Object} resArn
   * @param {String} fallbackRegion
   * @returns {Object}
   * @private
   */
  _parseResource(resArn, fallbackRegion) {
    const arn = resArn.ResourceARN;
    const tags = resArn.Tags;

    let parts = arn.split(':');
    let resource = parts.pop().split('/').pop();
    let [, , service, region, accountId] = parts;
    let code = tags.find(item => item.Key === 'ThubCode');

    return {
      service: service,
      region: region || fallbackRegion,
      accountId: accountId || this.accountId,
      resource: resource,
      project: code && code.Value || '-'
    };
  }

  /**
   * Credentials from a credential provider chain
   * @returns {Promise}
   * @private
   */
  _getCredentials() {
    if (!this.credentials) {
      const profile = process.env.AWS_DEFAULT_PROFILE || process.env.AWS_PROFILE;
      const isEcsConfigured = AWS.ECSCredentials.prototype.isConfiguredForEcsCredentials();
      const providers = [
        new AWS.EnvironmentCredentials('AWS'),
        new AWS.SharedIniFileCredentials({ profile }),
        isEcsConfigured ? new AWS.ECSCredentials() : new AWS.EC2MetadataCredentials()
      ];

      return new AWS.CredentialProviderChain(providers).resolvePromise().then(creds => {
        this.credentials = creds;
        return this.credentials;
      });
    }

    return Promise.resolve(this.credentials);
  }

  /**
   * Get list of AWS regions
   * @return {Array}
   * @private
   */
  _getRegions() {
    const list = fse.readJsonSync(path.join(templates.path, 'aws', 'regions.json'), { throws: false }) || [];

    return list
      .filter(region => region.public === true)
      .map(region => region.code);
  }

  /**
   * 10 min
   * @returns {Number}
   * @constructor
   */
  static get TTL() {
    return 600000;
  }
}

module.exports = ListCommand;
