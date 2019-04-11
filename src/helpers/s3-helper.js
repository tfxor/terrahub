'use strict';

const AWS = require('aws-sdk');
const fse = require('fs-extra');
const { join } = require('path');
const { globPromise } = require('./util');

class S3Helper {
  /**
   *
   */
  constructor() {
    this._s3 = new AWS.S3();
  }

  /**
   * @param {String} dirPath
   * @param {String} bucketName
   * @param {String} s3Path
   * @param {String[]} exclude
   * @return {Promise}
   */
  uploadDirectory(dirPath, bucketName, s3Path, { exclude = [] } = {}) {
    return globPromise('**', {
      cwd: dirPath,
      dot: true,
      ignore: exclude,
      nodir: true
    }).then(files =>
      Promise.all(files.map(file =>
        this.writeFile(bucketName, join(s3Path, file), fse.createReadStream(join(dirPath, file)))
      ))
    );
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
   * @param {String} prefix
   * @param {Boolean} returnChunks
   * @return {Promise<String[]|Array[]>}
   */
  listObjects(bucketName, prefix, { returnChunks = false } = {}) {
    const commonParams = {
      Bucket: bucketName,
      Prefix: prefix
    };
    const chunks = [];

    /**
     * @param {String} continuationToken
     * @return {Promise}
     */
    const iterate = (continuationToken = null) => {
      const params = continuationToken ?
        Object.assign({ ContinuationToken: continuationToken }, commonParams) :
        commonParams;

      return this._s3.listObjectsV2(params).promise().then(data => {
        chunks.push(data.Contents.map(content => content.Key));

        return data.IsTruncated ? iterate(data.NextContinuationToken) : Promise.resolve(chunks);
      });
    };

    return iterate().then(() => returnChunks ? chunks : [].concat(...chunks));
  }

  /**
   * @param {String} bucketName
   * @param {String} s3path
   * @return {Promise}
   */
  deleteDirectoryFromS3(bucketName, s3path) {
    return this.listObjects(bucketName, s3path, { returnChunks: true }).then(chunks => {
      return Promise.all(
        chunks.map(chunk => this._s3.deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: chunk.map(file => ({ Key: file }))
          }
        }).promise())
      );
    });
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
