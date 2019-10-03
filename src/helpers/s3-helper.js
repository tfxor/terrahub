'use strict';

const AWS = require('aws-sdk');
const fse = require('fs-extra');
const Fetch = require('./fetch');
const {
  retrieveSourceProfile, prepareCredentialsFile, createCredentialsFile, removeAwsEnvVars, setupAWSSharedFile
} = require('./util');

class S3Helper {
  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    this._s3 = new AWS.S3(options);
  }

  /**
   * Create s3 object
   * @param {String} bucketName
   * @param {String} objectKey
   * @param {Buffer|Blob|String|ReadableStream} body
   * @returns {Promise}
   */
  writeFile(bucketName, objectKey, body = '') {
    return this._s3.putObject({ Bucket: bucketName, Key: objectKey, Body: body }).promise();
  }

  /**
   * @param {String} bucketName
   * @param {{ localPath: String, s3Path: String }[]} pathMap
   * @return {Promise}
   */
  uploadFiles(bucketName, pathMap) {
    return Promise.all(
      pathMap.map(path => this.writeFile(bucketName, path.s3Path, fse.createReadStream(path.localPath))));
  }

  /**
   * Get s3 object
   * @param {String} bucketName
   * @param {String} objectKey
   * @param {Object} config
   * @param {Object} parameters
   * @returns {Promise}
   */
  getObject(bucketName, objectKey, config, parameters) {
    if (!config.terraform.tfvarsAccount) {
      return this._s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
    }

    return this._retriveCredsForTfVars(config, parameters).then(data => {
      const { credsPath, sourceProfile } = data;

      if (credsPath) {
        removeAwsEnvVars();
        this._s3 = new AWS.S3({ credentials: null });
        setupAWSSharedFile(sourceProfile, credsPath, config, config.distributor, process.env);
      }

      return this._s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
    });
  }

  /**
   * @param {Object} [config]
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  _retriveCredsForTfVars(config, parameters) {
    if (!config) {
      return Promise.resolve();
    }
    const { tfvarsAccount } = config.terraform;

    return this._findCloudAccount(tfvarsAccount, config, parameters);
  }

  /**
   * @param {String} tfvarsAccount
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  async _findCloudAccount(tfvarsAccount, config, parameters) {
    if (!tfvarsAccount) {
      return Promise.resolve();
    }

    const cloudAccounts = await this._retrieveCloudAccounts(config, parameters);
    const accountData = cloudAccounts.aws && cloudAccounts.aws.find(it => it.name === tfvarsAccount);

    if (!accountData) {
      return Promise.resolve();
    }

    const sourceProfile = retrieveSourceProfile(accountData, cloudAccounts);
    const credentials = prepareCredentialsFile(accountData, sourceProfile, config, true, config.distributor);
    const credsPath = createCredentialsFile(credentials, config, 'tfvars', config.distributor);

    return Promise.resolve({ credsPath, sourceProfile });
  }

  /**
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  async _retrieveCloudAccounts(config, parameters) {
    if (!this._cloudAccounts) {
      const fetch = new Fetch(parameters.fetch.baseUrl, parameters.fetch.authorization);
      const result = await fetch.get(`https://${parameters.config.api}.terrahub.io/v1/thub/cloud-account/retrieve`);
      this._cloudAccounts = result.data;
    }

    return this._cloudAccounts;
  }

  /**
   * Metadata bucket name
   * @returns {String}
   * @constructor
   */
  static get METADATA_BUCKET() {
    return 'data-lake-terrahub-us-east-1';
  }
}

module.exports = S3Helper;
