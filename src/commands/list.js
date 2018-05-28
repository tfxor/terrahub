'use strict';

const AWS = require('aws-sdk');
const AbstractCommand = require('../abstract-command');
const MemberAccessor = require('../helpers/member-accessor');
const accessor = new MemberAccessor({});
const https = require('https');


class ListCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('list')
      .setDescription('List resources and tags from AWS and database');
  }

  /**
   * @returns {Promise}
   */
  run() {
    return new Promise((resolve, reject) => {
      const tagging = new AWS.ResourceGroupsTaggingAPI({
        region: 'us-east-1',
        credentials: new AWS.SharedIniFileCredentials({ profile: 'saml' })
      });

      let params = {
        TagFilters: [{
          Key: 'DeepEnvironmentId',
          Values: ['2e4696b0']
        }]
      };

      /**
       * @param {String} arn
       * @returns {{resource: string, region: string, accountId: string, name: T}}
       */
      function parse(arn) {
        let parts = arn.split(':');
        let name = parts.pop().split('/').pop();
        let [, , resource, region, accountId] = parts;

        return { resource, region, accountId, name };
      }
      let n = false;
      console.log('##################');
      console.log('REGION\n');

      /**
       * @param {String} token
       * @returns {Promise}
       */
      function getPage(token = '') {
        params.PaginationToken = token;

        return tagging.getResources(params).promise().then(res => {
          res.ResourceTagMappingList.map(resource => resource.ResourceARN).forEach(arn => {
            let { resource, name } = parse(arn);
            accessor.set(`${resource}.${name}`, null);
          });

          return res.PaginationToken ? getPage(res.PaginationToken) : Promise.resolve(accessor.getRaw());
        });
      }

      getPage().then(data => {
        let obj = data;
        let j = 0;

        Object.keys(obj).forEach(key => {

          let flog = Object.keys(obj).length;
          let flag = Object.keys(obj[key]).length;
          let i = 0;
          j++;

          if (n === false) {
            console.log(`Project ${params.TagFilters[0].Values} | using ${flog} cloud resources:\n`)
            n = true;
          }

          console.log(`    ${j}. Amazon ${Object.keys(obj)[j - 1]} | using ${flag} resourses`);
          for (i; i < flag; i++) {
            console.log(`      ${j}.${i + 1}. ${Object.keys(obj[key])[i]}`);
          }
          console.log('\r')
        });
        let tmp = [];
        tmp.push(data);
        return Promise.resolve(tmp);
      }).then(ress => {
        let req = https.get('https://api-dev.terrahub.io/v1/cnci/terraform/list', (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', (d) => {
            console.log(JSON.parse(body));
          })
        });
        req.on('error', (e) => {
          // return reject(e);
          console.log(e)
        });
      }).catch(err => {
        console.log('err', err);
      });

    });
  }
}

module.exports = ListCommand;
