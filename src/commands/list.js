'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const fse = require('fs-extra');
const { toMd5 } = require('../helpers/util');
const HashTable = require('../helpers/hash-table');
const { defaultConfig } = require('../parameters');
const AbstractCommand = require('../abstract-command');

class ListCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('list')
      .setDescription('List projects > cloud accounts > regions > services > resources')
      .addOption('api-region', 'a', 'Resources in region', String, 'us-east-1')
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
    this.region = this.getOption('api-region');
    this.accountId = '';
    this.credentials = null;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const regions = this.getOption('regions');
    const projects = this.getOption('projects');
    const accounts = this.getOption('accounts');
    const services = this.getOption('services');

    return this._getCredentials()
      .then(credentials => {
        const sts = new AWS.STS({ credentials });

        return sts.getCallerIdentity().promise().then(res => {
          this.accountId = res.Account;
          return this._cachePath();
        });
      })
      .then(cachePath => this._getCached(cachePath))
      .then(cached => {
        return cached ? Promise.resolve(cached) : this._getFromApi();
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
        this.logger.raw('Projects (Managed by TerraHub)');

        if (projects.length === 0 && accounts.length === 0 && regions.length === 0 && services.length === 0) {
          this._showSummary();
        } else {
          this._showTree(this.hash.getRaw());
        }

        this.logger.raw('');
        this.logger.info('Above list includes ONLY cloud resources that support tagging api.');
        this.logger.raw('   ',
          'Please visit https://www.terrahub.io and register to see ALL cloud resources,',
          'even the ones that are NOT supported by tagging api.'
        );

        return Promise.resolve();
      })
      .then(() => Promise.resolve('Done'));
  }

  /**
   * Show overall information
   * @private
   */
  _showSummary() {
    Object.keys(this.hash.getRaw()).forEach((project, i) => {
      this.logger.raw(` ${i + 1}. ${project}`);
    });
  }

  /**
   * @param {Object} data
   * @param {Number} level
   * @private
   */
  _showTree(data, level = 0) {
    let offset = ' '.repeat(level);
    let titles = ['Project', 'Account', 'Region', 'Service', 'Resource'];

    Object.keys(data).forEach((key, value) => {
      if (data[key] !== null) {
        const keys = Object.keys(data[key]);

        this.logger.raw(`${offset} ${key} (${titles[level]} ${keys.length} of X)`);
        this._showTree(data[key], level + 1);
      } else {
        this.logger.raw(`${offset} ${key} (${titles[level]} ${value + 1} of X)`);
      }
    });
  }

  /**
   * @returns {Promise}
   * @private
   */
  _getFromApi() {
    return this._getCredentials()
      .then(credentials => new AWS.ResourceGroupsTaggingAPI({ region: this.region, credentials }))
      .then(taggingApi => this._getResources(taggingApi))
      .then(data => {
        const cachePath = this._cachePath();

        return fse.outputJson(cachePath, data).then(() => {
          return data;
        });
      });
  }

  /**
   * Get cached results
   * @param {String} cachePath
   * @returns {Promise}
   * @private
   */
  _getCached(cachePath) {
    if (!fs.existsSync(cachePath)) {
      return Promise.resolve();
    }

    const now = new Date();
    const { birthtimeMs } = fs.statSync(cachePath);

    if (parseInt(birthtimeMs) + ListCommand.TTL > now.getTime()) {
      return fse.readJSON(cachePath);
    }

    return fse.unlink(cachePath);
  }

  /**
   * @returns {String}
   * @private
   */
  _cachePath() {
    return defaultConfig('cache', 'list', `${toMd5(this.accountId + this.region)}.json`);
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
      res.ResourceTagMappingList.forEach(res => {data.push(this._parseResource(res))});

      if (!res.PaginationToken) {
        return Promise.resolve(data);
      }

      return this._getResources(taggingApi, { PaginationToken: res.PaginationToken }, data);
    });
  }

  /**
   * @param {Object} resArn
   * @returns {Object}
   * @private
   */
  _parseResource(resArn) {
    const result = {};
    const arn = resArn.ResourceARN;
    const tags = resArn.Tags;

    tags.forEach(item => {
      result[item.Key] = item.Value
    });

    let parts = arn.split(':');
    let resource = parts.pop().split('/').pop();
    let [, , service, region, accountId] = parts;
    // @todo switch to ThubEnv
    let project = result.hasOwnProperty('DeepEnvironmentId') ? result['DeepEnvironmentId'] : '-';

    return Object.assign(result, {
      service: service,
      region: region || this.region,
      accountId: accountId || this.accountId,
      resource: resource,
      project: project
    });
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
   * 10 min
   * @returns {Number}
   * @constructor
   */
  static get TTL() {
    return 3000000;
  }
}

module.exports = ListCommand;
