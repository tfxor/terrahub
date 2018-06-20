'use strict';

const path = require('path');
const Terraform = require('../helpers/terraform');
const { config } = require('../parameters');
const { toMd5, promiseRequest } = require('../helpers/util');

class Terrahub {
  /**
   * @param {Object} cfg
   */
  constructor(cfg) {
    this._action = '';
    this._config = cfg;
    this._terraform = new Terraform(cfg);
    this._timestamp = Math.floor(Date.now() / 1000).toString();
    this._componentHash = toMd5(this._config.root);
  }

  /**
   * @param {String} event
   * @param {Error|String} err
   * @returns {Promise}
   * @private
   */
  _on(event, err = null) {
    if (!config.token) {
      return Promise.resolve();
    }

    const data = {
      Hash: this._componentHash,
      Name: this._config.name,
      Status: event,
      Action: this._action,
      IsError: false,
    };

    if (err) {
      data.IsError = true;
      data['Error'] = err.message || err;
    }

    return this._apiCall(this._getEndpoint(), data);
  }

  /**
   * Compose terrahub task
   * @param {String} action
   * @returns {Promise}
   */
  getTask(action) {
    this._action = action;

    if (!['init', 'workspace', 'plan', 'apply', 'destroy'].includes(this._action)) {
      return this._terraform[action]();
    }

    return this._getTask();
  }

  /**
   * Check if custom hook is provided
   * @param {String} hook
   * @returns {Function}
   * @private
   */
  _hook(hook) {
    try {
      const hookPath = this._config.hooks[this._action][hook];
      const fullPath = path.isAbsolute(hookPath)
        ? hookPath
        : path.join(this._config.app, hookPath);

      return require(fullPath);
    } catch (err) {
      return () => Promise.resolve();
    }
  }

  /**
   * Get set of actions
   * @returns {Promise}
   * @private
   */
  _getTask() {
    return this._on('start')
      .then(() => this._hook('before')(this._config))
      .then(() => this._terraform[this._action]())
      .then(buf => this._upload(buf))
      .then(res => this._hook('after')(this._config, res))
      .then(() => this._on('end'))
      .catch(err => this._on('error', err))
    ;
  }

  /**
   * @param {Buffer} buffer
   * @returns {Promise}
   * @private
   */
  _upload(buffer) {
    if (!config.token || !buffer || !['plan', 'apply', 'destroy'].includes(this._action)) {
      return Promise.resolve();
    }

    return this._putObject(this._getKey(), buffer).then(() => Promise.resolve(buffer));
  }

  /**
   * Get destination key
   * @returns {String}
   * @private
   */
  _getKey() {
    const keySpace = config.env === 'prod' ? 'public' : `public-${config.env}`;
    const keyName = `${this._componentHash}-terraform-${this._action}.txt`;

    return `${Terrahub.METADATA_DOMAIN}/${keySpace}/${this._timestamp}/${keyName}`;
  }

  /**
   * Get API endpoint
   * @returns {String}
   * @private
   */
  _getEndpoint() {
    const subDomain = config.env === 'prod' ? 'api' : `api-${config.env}`;

    return `https://${subDomain}.terrahub.io/v1/cnci/realtime/create`;
  }

  /**
   * Call api endpoint
   * @param {String} url
   * @param {Object} body
   * @returns {Promise}
   * @private
   */
  _apiCall(url, body) {
    const options = {
      uri: url,
      method: 'POST',
      json: true,
      body: body
    };

    return promiseRequest(options);
  }

  /**
   * Put object via bucket url
   * @param {String} url
   * @param {Buffer} body
   * @returns {Promise}
   * @private
   */
  _putObject(url, body) {
    const options = {
      uri: url,
      method: 'PUT',
      body: body,
      headers: Object.assign({ 'Content-Type': 'text/plain' }, this._awsMetadata())
    };

    return promiseRequest(options);
  }

  /**
   * Get AWS metadata
   * @returns {Object}
   * @private
   */
  _awsMetadata() {
    return {
      'x-amz-acl': 'bucket-owner-full-control',
      'x-amz-meta-thub-token': config.token,
      'x-amz-meta-request-id': toMd5(this._timestamp),
      'x-amz-meta-thub-action': this._action
    }
  }

  /**
   * Metadata bucket associated domain
   * @returns {String}
   * @constructor
   */
  static get METADATA_DOMAIN() {
    return 'https://data-lake-terrahub-us-east-1.s3.amazonaws.com';
  }
}

module.exports = Terrahub;
