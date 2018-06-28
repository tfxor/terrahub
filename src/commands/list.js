'use strict';

const os = require('os');
const fs = require('fs');
const AWS = require('aws-sdk');
const fse = require('fs-extra');
const treeify = require('treeify');
const { toMd5 } = require('../helpers/util');
const HashTable = require('../helpers/hash-table');
const { homePath } = require('../parameters');
const AbstractCommand = require('../abstract-command');

class ListCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('list')
      .setDescription('list projects > cloud accounts > regions > services > resources')
      .addOption('api-region', 'a', 'Resources in region', String, 'us-east-1')
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
    this.region = this.getOption('api-region');
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
        this.logger.log('Please visit https://www.terrahub.io and register to see ALL cloud resources, ' +
          'including the ones NOT supported by tagging api.'
        );

        return Promise.resolve();
      })
      .then(() => Promise.resolve('Done'));
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
    let result = {};
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
    return homePath('cache', 'list', `${toMd5(this.accountId + this.region)}.json`);
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
    return 600000;
  }
}

module.exports = ListCommand;
