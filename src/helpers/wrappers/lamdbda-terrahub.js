'use strict';

const Dictionary = require('../dictionary');

class LambdaTerrahub {

  constructor(config, fetch) {
    this.config = config;
    this.fetch = fetch;
  }

  /**
   * @param {Object} data
   * @param {Error|String} err
   * @return {Promise}
   * @private
   * @override
   */
  on(data, err = null) {
    let error = null;
    let payload = {
      action: this._action,
      status: data.status,
      projectId: this._project.id,
      componentHash: this._componentHash,
      componentName: this._config.name,
      terraformRunId: this._runId
    };

    if (err) {
      error = err instanceof Error ? err : new Error(err || 'Unknown error');
      payload.error = error.message.trim();
    }

    if (payload.action === 'plan' && data.status === Dictionary.REALTIME.SUCCESS) {
      payload.metadata = data.metadata;
    }

    let actionPromise = !this.config.token
      ? Promise.resolve()
      : this.fetch.post('thub/realtime/create', { body: JSON.stringify(payload) });

    return actionPromise.then(() => {
      return payload.hasOwnProperty('error') ? Promise.reject(error) : Promise.resolve(data);
    });
  }

  /**
   * @return {Promise}
   * @protected
   * @override
   */
  checkProject() {
    if (!this.config.token) {
      return Promise.resolve();
    }

    const payload = {
      name: this._project.name,
      hash: this._project.code
    };

    return this.fetch.post('thub/project/create', { body: JSON.stringify(payload) }).then(json => {
      this._project.id = json.data.id;

      return Promise.resolve();
    });
  }

  /**
   * @param {Object} data
   * @return {Promise}
   * @private
   * @abstract
   */
  upload(data) {
    if (!this.config.token || !data || !data.buffer || !['plan', 'apply', 'destroy'].includes(this._action)) {
      return Promise.resolve(data);
    }

    const key = this._getKey();
    const url = `${Terrahub.METADATA_DOMAIN}/${key}`;

    return this._putObject(url, data.buffer)
      .then(() => this._callParseLambda(key))
      .then(() => Promise.resolve(data));
  }

  /**
   * Get destination key
   * @return {String}
   * @private
   */
  _getKey() {
    const dir = this.config.api.replace('api', 'public');
    const keyName = `${this._componentHash}-terraform-${this._action}.txt`;

    return `${dir}/${this._timestamp}/${keyName}`;
  }

  /**
   * @param {String} key
   * @return {Promise}
   * @private
   */
  _callParseLambda(key) {
    const url = `thub/resource/parse-${this._action}`;

    const options = {
      body: JSON.stringify({
        key: key,
        projectId: this._project.id,
        thubRunId: this._runId
      })
    };

    const promise = this.fetch.post(url, options).catch(error => {
      error.message = this._addNameToMessage('Failed to trigger parse function');
      console.error(error);

      return Promise.resolve();
    });

    return process.env.DEBUG ? promise : Promise.resolve();
  }

  /**
   * Put object via bucket url
   * @param {String} url
   * @param {Buffer} body
   * @return {Promise}
   * @private
   */
  _putObject(url, body) {
    const options = {
      method: 'PUT',
      body: body,
      headers: { 'Content-Type': 'text/plain', 'x-amz-acl': 'bucket-owner-full-control' }
    };

    return this.fetch.request(url, options);
  }

  /**
   * Metadata bucket associated domain
   * @return {String}
   * @constructor
   */
  static get METADATA_DOMAIN() {
    return 'https://data-lake-terrahub-us-east-1.s3.amazonaws.com';
  }
}

module.exports = LambdaTerrahub;
