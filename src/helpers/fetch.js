'use strict';

const URL = require('url');
const merge = require('lodash.mergewith');
const fetch = require('node-fetch').default;
const NotFoundException = require('../exceptions/not-found-exception');
const AuthenticationException = require('../exceptions/authentication-exception');

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

    return fetch(URL.resolve(this.baseUrl, url), params)
      .then(this._handleResponse)
      .catch(Fetch._handleError);
  }

  /**
   * @param {String} url
   * @param {Object} opts
   * @return {Promise}
   */
  post(url, opts = {}) {
    const urlInitArr = url.split('/');
    const isUpdate = urlInitArr.find((el) => el === 'update');
    const defaults = {
      method: (isUpdate !== undefined && isUpdate !== null) ? 'PATCH' : 'POST',
      headers: this._getHeaders()
    };

    return fetch(URL.resolve(this.baseUrl, urlInitArr.filter(
      (el) => !['create', 'update'].includes(el)).join('/')
    ), merge(defaults, opts))
      .then(this._handleResponse)
      .catch(Fetch._handleError);
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
      'x-tfxor-auth-source': 'token',
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
      let error;
      switch (result.status) {
        case 403:
          error = new AuthenticationException('Provided TERRAHUB_TOKEN is invalid.');
          break;
        case 404:
          error = new NotFoundException(json);
          break;

        case 500:
        case 504:
          error = new Error(
            'Error occurred. Please try again. If this problem persists, ' +
            'enable extra debugging (DEBUG=debug) to see more details and open an issue at ' +
            'https://github.com/tfxor/terrahub/issues'
          );
          break;
        default:
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
  static _handleError(error) {
    let message;
    if (['EAI_AGAIN', 'NetworkingError'].includes(error.code)) {
      message = 'Internet connection issue';
    }

    throw message ? { ...error, message } : error;
  }
}

module.exports = Fetch;
