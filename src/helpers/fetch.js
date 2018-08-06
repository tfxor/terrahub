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
    return fetch(URL.resolve(this.baseUrl, url), {
      headers: {
        'Authorization': this.authorization
      }
    });
  }

  /**
   * @param {String} url
   * @param {Object} opts
   * @return {Promise}
   */
  post(url, opts = {}) {
    const defaults = {
      method: 'POST',
      headers: {
        'Authorization': this.authorization,
        'Content-Type': 'application/json'
      }
    };

    return fetch(URL.resolve(this.baseUrl, url), merge(defaults, opts));
  }

  /**
   * @param {String} url
   * @param {Object} opts
   * @return {Promise}
   */
  put(url, opts = {}) {
    return this.post(url, merge(opts, { method: 'PUT' }));
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
}

module.exports = Fetch;
