'use strict';

const AWS = require('aws-sdk');
const fse = require('fs-extra');
const { join, relative } = require('path');
const Fetch = require('./fetch');
const {
  retrieveSourceProfile, prepareCredentialsFile, createCredentialsFile,
  removeAwsEnvVars, setupAWSSharedFile, globPromise, arrayUnCommon
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
    return this._s3.upload({ Bucket: bucketName, Key: objectKey, Body: body }).promise();
    // return this._s3.putObject({ Bucket: bucketName, Key: objectKey, Body: body }).promise();
  }

  /**
   * @param {String} bucketName
   * @param {{ localPath: String, s3Path: String }[]} pathMap
   * @return {Promise}
   */
  uploadFiles(bucketName, pathMap) {
    return Promise.all(
      pathMap.map(path => this.writeFile(bucketName, path.s3Path, fse.readFileSync(path.localPath))));
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
        this._s3 = new AWS.S3({ credentials: null});
        setupAWSSharedFile(sourceProfile, credsPath, config, config.distributor, process.env);
      }

      return this._s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
    });
  }

  /**
   * Pseudo-sync
   * @param {String} rootPath
   * @param {String} s3Prefix
   * @param {String[]} relativePaths
   * @return {Promise}
   */
  async syncPaths(rootPath, s3Prefix, relativePaths) {
    const [localFiles, s3Keys] = await Promise.all([
      globPromise('**', { cwd: rootPath, dot: true, nodir: true }),
      this.listByPrefixes(S3Helper.METADATA_BUCKET, relativePaths.map(it => join(s3Prefix, it)))
    ]);
    // uncommonOne - required files that need to be downloaded
    // uncommonTwo - redundant files that need to be deleted
    const { uncommonOne, uncommonTwo } = arrayUnCommon(s3Keys.map(key => relative(s3Prefix, key)), localFiles);

    return Promise.all([
      this.downloadObjects(
        S3Helper.METADATA_BUCKET,
        uncommonOne.map(it => ({ key: join(s3Prefix, it), destination: join(rootPath, it) }))
      ),
      S3Helper.deleteFiles(uncommonTwo.map(it => join(rootPath, it)))
    ]);
  }

  /**
   * @param {String} bucketName
   * @param {String[]} prefixes
   * @param {{ returnChunks: Boolean }} options
   * @return {Promise<String[]|Array[]>}
   */
  async listByPrefixes(bucketName, prefixes, options = {}) {
    const { returnChunks = false } = options;

    const results = await Promise.all(
      prefixes.map(it => this.listObjects(bucketName, it, { returnChunks: returnChunks }))
    );

    return [].concat(...results);
  }

  /**
   * @param {String} bucketName
   * @param {String} prefix
   * @param {{ returnChunks: Boolean }} options
   * @return {Promise<String[]|Array[]>}
   */
  async listObjects(bucketName, prefix = '/', { returnChunks = false } = {}) {
    const commonParams = {
      Bucket: bucketName,
      Prefix: prefix
    };
    const chunks = [];

    let isTruncated = true;
    let continuationToken = null;

    while (isTruncated) {
      const params = continuationToken
        ? ({ ContinuationToken: continuationToken, ...commonParams })
        : commonParams;

      // eslint-disable-next-line no-await-in-loop
      const data = await this._s3.listObjectsV2(params).promise();

      chunks.push(data.Contents.map(content => content.Key));

      isTruncated = data.IsTruncated;
      continuationToken = data.NextContinuationToken;
    }

    return returnChunks ? chunks : [].concat(...chunks);
  }

  /**
   * @param {String} bucketName
   * @param {{ key: String, destination: String }[]} objects
   * @return {Promise}
   */
  downloadObjects(bucketName, objects) {
    return Promise.all(
      objects.map(it => {
        const stream = this._s3.getObject({
          Bucket: bucketName,
          Key: it.key
        }).createReadStream();

        return S3Helper.writeFileStream(stream, it.destination);
      })
    );
  }

  /**
   * @param {String[]} paths
   * @return {Promise}
   */
  static deleteFiles(paths) {
    return Promise.all(paths.map(it => fse.remove(it)));
  }

  /**
   * @param {ReadableStream} fileStream
   * @param {String} destination
   * @return {Promise}
   */
  static async writeFileStream(fileStream, destination) {
    await fse.ensureFile(destination);

    return new Promise(resolve => {
      fileStream.on('end', () => resolve());
      fileStream.pipe(fse.createWriteStream(destination));
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
