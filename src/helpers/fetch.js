'use strict';

const URL = require('url');
const AuthenticationException = require('../exceptions/authentication-exception');
const logger = require('./logger');
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

    return fetch(URL.resolve(this.baseUrl, url), params).then(this._handleResponse).catch(this._handleError);
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

    return fetch(URL.resolve(this.baseUrl, url), merge(defaults, opts))
      .then(this._handleResponse).catch(this._handleError);
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
    return result.json().then(json => {
      logger.debug(JSON.stringify({
        url: result.url,
        status: result.status,
        body: json
      }, null, 2));

      let error;
      switch (result.status) {
        case 403:
          error = new AuthenticationException();
          break;

        case 500:
        case 504:
          error = new Error('Error occurred. Please try again. If this problem persists, ' +
            'enable extra debugging (DEBUG=debug) to see more details and open an issue at ' +
            'https://github.com/TerraHubCorp/terrahub/issues');
          break;
      }

      if (error) {
        return Promise.reject(error);
      }

      return result.ok && !json.hasOwnProperty('errorType') ? json : Promise.reject(json);
    });
  }

  /**
   * @param {Error} error
   * @throws {Error}
   * @private
   */
  _handleError(error) {
    if (['EAI_AGAIN', 'NetworkingError'].includes(error.code)) {
      error.message = 'Internet connection issue';
    }

    throw error;
  }
}

module.exports = Fetch;
