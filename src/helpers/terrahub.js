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
    this._runId = process.env.THUB_RUN_ID;
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
    let error = null;
    let data = {
      ThubToken: config.token, // required for API
      Action: this._action,
      ProjectHash: this._config.code,
      ProjectName: this._config.appName,
      TerraformRunId: this._runId,
      TerraformHash: this._componentHash,
      TerraformName: this._config.name,
      Status: event
    };

    if (err) {
      error = new Error(err.message || err);
      data['Error'] = error.message;
    }

    if (!config.token) {
      return data.hasOwnProperty('Error') ? Promise.reject(error) : Promise.resolve();
    }

    return this._apiCall(this._getEndpoint(), data).then(() => {
      return data.hasOwnProperty('Error') ? Promise.reject(error) : Promise.resolve();
    });
  }

  /**
   * Compose terrahub task
   * @param {String} action
   * @returns {Promise}
   */
  getTask(action) {
    this._action = action;

    if (!['init', 'workspaceSelect', 'plan', 'apply', 'output', 'destroy'].includes(this._action)) {
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
      .then(() => this._on('success'))
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
      return Promise.resolve(buffer);
    }

    return this._putObject(this._getKey(), buffer).then(() => Promise.resolve(buffer));
  }

  /**
   * Get destination key
   * @returns {String}
   * @private
   */
  _getKey() {
    const dir = config.api.replace('api', 'public');
    const keyName = `${this._componentHash}-terraform-${this._action}.txt`;

    return `${Terrahub.METADATA_DOMAIN}/${dir}/${this._timestamp}/${keyName}`;
  }

  /**
   * Get API endpoint
   * @returns {String}
   * @private
   */
  _getEndpoint() {
    return `https://${config.api}.terrahub.io/v1/thub/realtime/create`;
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
      'x-amz-meta-thub-code': this._config.code,
      'x-amz-meta-thub-name': this._config.appName,
      'x-amz-meta-thub-token': config.token,
      'x-amz-meta-thub-run-id': this._runId,
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
