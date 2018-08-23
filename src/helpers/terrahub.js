'use strict';

const path = require('path');
const Terraform = require('../helpers/terraform');
const { toMd5 } = require('../helpers/util');
const { config, fetch } = require('../parameters');
const logger = require('./logger');

class Terrahub {
  /**
   * @param {Object} cfg
   */
  constructor(cfg) {
    this._runId = process.env.THUB_RUN_ID;
    this._action = '';
    this._config = cfg;
    this._project = cfg.project;
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
      Action: this._action,
      Provider: this._project.provider,
      ProjectHash: this._project.code,
      ProjectName: this._project.name,
      TerraformHash: this._componentHash,
      TerraformName: this._config.name,
      TerraformRunId: this._runId,
      Status: event
    };

    if (err) {
      error = new Error(err.message || err);
      data['Error'] = error.message;
    }

    let actionPromise = !config.token
      ? Promise.resolve()
      : fetch.post('thub/realtime/create', { body: JSON.stringify(data) });

    return actionPromise.then(() => {
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

    return (!['init', 'workspaceSelect', 'plan', 'apply', 'output', 'destroy'].includes(this._action) ?
      this._terraform[action]() : this._getTask())
      .then(() => this._terraform.getActionOutput());
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
        : path.join(this._project.root, hookPath);

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
      .catch(err => {
        throw ['EAI_AGAIN', 'NetworkingError'].includes(err.code) ?
          new Error('TerraHub is missing internet connection') :
          err;
      });
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

    const key = this._getKey();
    const url = this._buildS3Url(key);

    return this._putObject(url, buffer)
      .then(() => this._callParseLambda(key))
      .then(() => Promise.resolve(buffer));
  }

  /**
   * Get destination key
   * @returns {String}
   * @private
   */
  _getKey() {
    const dir = config.api.replace('api', 'public');
    const keyName = `${this._componentHash}-terraform-${this._action}.txt`;

    return `${dir}/${this._timestamp}/${keyName}`;
  }

  /**
   * Get destination url
   * @param {String} key
   * @return {string}
   * @private
   */
  _buildS3Url(key) {
    return `${Terrahub.METADATA_DOMAIN}/${key}`;
  }

  /**
   * @param {String} key
   * @return {Promise}
   * @private
   */
  _callParseLambda(key) {
    const url = `thub/resource/parse-${ this._action === 'plan' ? 'plan' : 'state' }`;
    const options = {
      body: Object.assign(this._awsMetadata(), { Key: key }),
    };

    fetch.post(url, options).catch(() => logger.error(`[${this._config.name}] Failed to trigger parse function`));

    return Promise.resolve();
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
      method: 'PUT',
      body: body,
      headers: { 'Content-Type': 'text/plain' }
    };

    return fetch.request(url, options);
  }

  /**
   * Get AWS metadata
   * @returns {Object}
   * @private
   */
  _awsMetadata() {
    return {
      'ProjectCode': this._project.code,
      'ProjectName': this._project.name,
      'ThubRunId': this._runId,
      'ThubAction': this._action
    };
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
