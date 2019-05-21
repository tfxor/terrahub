'use strict';

const GcpStorage = require('@google-cloud/storage');

class GsHelper {
  /**
   *
   */
  constructor() {
    this._gs = new GcpStorage.Storage();
  }

  /**
   * Get gs object
   * @param {String} bucketName
   * @param {String} objectKey
   * @returns {Promise}
   */
  getObject(bucketName, objectKey) {
    const remoteTfvarsStorage = this._gs.bucket(bucketName);
    const file = remoteTfvarsStorage.file(objectKey);
    return file.download().then(data => data[0]);
  }
}

module.exports = GsHelper;
