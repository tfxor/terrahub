'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const fse = require('fs-extra');
const { toMd5 } = require('../helpers/util');
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
      .addOption('region', 'r', 'Resources in region', String, 'us-east-1')
      .addOption('profile', 'p', 'AWS CLI profile', String, 'saml')
      .addOption('filter', 'f', 'Filter statement', String)
    ;

    // @example: terrahub list -f 2e4696b0
  }

  /**
   * @returns {Promise}
   */
  run() {
    const region = this.getOption('region');
    const filter = this.getOption('filter');
    const profile = this.getOption('profile');
    const cachePath = this._cachePath(region, filter);
    const credentials = new AWS.SharedIniFileCredentials({ profile });
    const tagging = new AWS.ResourceGroupsTaggingAPI({ region, credentials });
    const params = {
      TagFilters: [{
        Key: 'DeepEnvironmentId', // @todo refactor this
        Values: [filter]
      }]
    };

    return this._getCached(cachePath).then(result => {
      return result ? Promise.resolve(result) : this._getFromApi(tagging, params);
    }).then(data => {
      this.logger.raw(`Found ${data.length} resources`);

      return fse.writeJson(cachePath, data);
    }).then(() => Promise.resolve('Done'));
  }

  /**
   * @param {ResourceGroupsTaggingAPI} tagging
   * @param {Object} params
   * @returns {Promise}
   * @private
   */
  _getFromApi(tagging, params) {
    return this._getArns(tagging, params).then(arns => {

      // @todo parse and normalize ARNs
      return arns;
    });
  }

  /**
   * Get cached results
   * @param {String} cachePath
   * @returns {Promise}
   * @private
   */
  _getCached(cachePath) {
    return fs.existsSync(cachePath) ? fse.readJSON(cachePath) : fse.ensureFile(cachePath);
  }

  /**
   * @param {String} region
   * @param {String} filter
   * @returns {String}
   * @private
   */
  _cachePath(region, filter) {
    return defaultConfig('cache', 'list', `${toMd5(region + filter)}.json`);
  }

  /**
   * Get full list of matched ARNs
   * @param {ResourceGroupsTaggingAPI} tagging
   * @param {Object} params
   * @param {Array} data
   * @returns {Promise}
   * @private
   */
  _getArns(tagging, params, data = []) {
    return tagging.getResources(params).promise().then(res => {
      res.ResourceTagMappingList.map(resource => resource.ResourceARN).forEach(arn => data.push(arn));

      if (!res.PaginationToken) {
        return Promise.resolve(data);
      }

      return this._getArns(
        tagging, Object.assign(params, { PaginationToken: res.PaginationToken }), data
      );
    });
  }

  // @todo remove after refactoring
  // run() {
  //   const accessor = new MemberAccessor({});
  //
  //   return new Promise((resolve, reject) => {
  //     const tagging = new AWS.ResourceGroupsTaggingAPI({
  //       region: 'us-east-1',
  //       credentials: new AWS.SharedIniFileCredentials({ profile: 'saml' })
  //     });
  //
  //     let params = {
  //       TagFilters: [{
  //         Key: 'DeepEnvironmentId',
  //         Values: ['2e4696b0']
  //       }]
  //     };
  //
  //     /**
  //      * @param {String} arn
  //      * @returns {{resource: string, region: string, accountId: string, name: T}}
  //      */
  //     function parse(arn) {
  //       let parts = arn.split(':');
  //       let name = parts.pop().split('/').pop();
  //       let [, , resource, region, accountId] = parts;
  //
  //       return { resource, region, accountId, name };
  //     }
  //     let n = false;
  //     console.log('##################');
  //     console.log('REGION\n');
  //
  //     /**
  //      * @param {String} token
  //      * @returns {Promise}
  //      */
  //     function getPage(token = '') {
  //       params.PaginationToken = token;
  //
  //       return tagging.getResources(params).promise().then(res => {
  //         res.ResourceTagMappingList.map(resource => resource.ResourceARN).forEach(arn => {
  //           let { resource, name } = parse(arn);
  //           accessor.set(`${resource}.${name}`, null);
  //         });
  //
  //         return res.PaginationToken ? getPage(res.PaginationToken) : Promise.resolve(accessor.getRaw());
  //       });
  //     }
  //
  //     getPage().then(data => {
  //       let obj = data;
  //       let j = 0;
  //
  //       Object.keys(obj).forEach(key => {
  //
  //         let flog = Object.keys(obj).length;
  //         let flag = Object.keys(obj[key]).length;
  //         let i = 0;
  //         j++;
  //
  //         if (n === false) {
  //           console.log(`Project ${params.TagFilters[0].Values} | using ${flog} cloud resources:\n`)
  //           n = true;
  //         }
  //
  //         console.log(`    ${j}. Amazon ${Object.keys(obj)[j - 1]} | using ${flag} resourses`);
  //         for (i; i < flag; i++) {
  //           console.log(`      ${j}.${i + 1}. ${Object.keys(obj[key])[i]}`);
  //         }
  //         console.log('\r')
  //       });
  //       let tmp = [];
  //       tmp.push(data);
  //       return Promise.resolve(tmp);
  //     }).then(ress => {
  //       let req = https.get('https://api-dev.terrahub.io/v1/cnci/terraform/list', (res) => {
  //         let body = '';
  //         res.on('data', (chunk) => {
  //           body += chunk;
  //         });
  //         res.on('end', (d) => {
  //           console.log(JSON.parse(body));
  //         })
  //       });
  //       req.on('error', (e) => {
  //         // return reject(e);
  //         console.log(e)
  //       });
  //     }).catch(err => {
  //       console.log('err', err);
  //     });
  //
  //   });
  // }
}

module.exports = ListCommand;
