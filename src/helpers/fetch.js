'use strict';

const URL = require('url');
const fetch = require('node-fetch');
const merge = require('lodash.mergewith');

class Fetch {
  /**
   * @param {String} baseUrl
   * @param {String} authorization
   */
  constructor(baseUrl, authorization) {
    this.baseUrl = baseUrl;
    this.authorization = authorization ? authorization : 'anonymous';
  }

  /**
   * @param {String} url
   * @return {Promise}
   */
  get(url) {
    const params = {
      method: 'GET',
      headers: this._getHeaders()
    };

    return fetch(URL.resolve(this.baseUrl, url), params).then(this._handleResponse);
  }

  /**
   * @param {String} url
   * @param {Object} opts
   * @return {Promise}
   */
  post(url, opts = {}) {
    const defaults = {
      method: 'POST',
      headers: this._getHeaders()
    };

    return fetch(URL.resolve(this.baseUrl, url), merge(defaults, opts)).then(this._handleResponse);
  }

  /**
   * Use native implementation
   * @param {String} url
   * @param {Object} opts
   * @return {Promise}
   */
  request(url, opts = {}) {
    return fetch(url, opts);
  }

  /**
   * @return {Object}
   * @private
   */
  _getHeaders() {
    return {
      'Authorization': this.authorization,
      'Content-Type': 'application/json'
    };
  }

  /**
   * @param {Object} result
   * @return {Promise}
   * @private
   */
  _handleResponse(result) {
    if (result.status === 403) {
      return Promise.reject({ message: 'Provided THUB_TOKEN is invalid', errorType: 'ValidationException' });
    }

    return result.json().then(json => {
      return result.ok && !json.hasOwnProperty('errorType') ? json : Promise.reject(json);
    });
  }
}

module.exports = Fetch;
