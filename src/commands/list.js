'use strict';

const AbstractCommand = require('../abstract-command');
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
      let req = https.get('https://api-dev.terrahub.io/v1/cnci/terraform/list', (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', (d) => {
          return resolve(body);
        })
      });
      req.on('error', (e) => {
        return reject(e);
      });
    });
  }
}

module.exports = ListCommand;
