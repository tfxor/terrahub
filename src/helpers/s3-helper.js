'use strict';

const AWS = require('aws-sdk');
const fse = require('fs-extra');
const ApiHelper = require('./api-helper');

class S3Helper {
  /**
   *
   */
  constructor() {
    this._s3 = new AWS.S3();
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
    return Promise.all(pathMap.map(path =>
      this.writeFile(bucketName, path.s3Path, fse.createReadStream(path.localPath))
    ));
  }

  /**
   * Get s3 object
   * @param {String} bucketName
   * @param {String} objectKey
   * @param {Object} config
   * @returns {Promise}
   */
  getObject(bucketName, objectKey, config) {
    return this.retriveCredsForTfVars(config).then(credentials => {
      if (credentials) {
        const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = credentials;
        this._s3 = new AWS.S3({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });
      }

      return this._s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
    });
  }

  /**
   * @param {Object} [config]
   * @return {Promise || void}
   */
  async retriveCredsForTfVars(config) {
    if (!config) {
      return Promise.resolve();
    }

    const { tfvarsAccount } = config.terraform;

    if (tfvarsAccount) {
      const cloudAccounts = await ApiHelper.retrieveCloudAccounts();
      const configAccount = cloudAccounts.aws.find(it => it.name === tfvarsAccount);

      if (configAccount) {
        const sourceProfile = configAccount.type === 'role'
          ? cloudAccounts.aws.find(it => it.id === configAccount.env_var.AWS_SOURCE_PROFILE.id) : null;

        return Promise.resolve({
          AWS_ACCESS_KEY_ID: sourceProfile ? sourceProfile.env_var.AWS_ACCESS_KEY_ID.value : configAccount.env_var.AWS_ACCESS_KEY_ID.value,
          AWS_SECRET_ACCESS_KEY: sourceProfile ? sourceProfile.env_var.AWS_SECRET_ACCESS_KEY.value : configAccount.env_var.AWS_SECRET_ACCESS_KEY.value
        });
      }
    }

    return Promise.resolve();
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
