'use strict';

class HashTable {
  /**
   * Constructor
   * @param {Object} object
   * @param {String} separator
   */
  constructor(object = {}, separator = '.') {
    this._table = object;
    this._separator = separator;
  }

  /**
   * Get raw data
   * @return {Object}
   */
  getRaw() {
    return this._table;
  }

  /**
   * Ser property
   * @param {String} path
   * @param {*} value
   */
  set(path, value) {
    let [cfg, key] = this._handle(path);

    cfg[key] = value;
  }

  /**
   * Get property
   * @param {String} path
   * @return {Boolean}
   */
  has(path) {
    let [cfg, key] = this._handle(path);

    return !!cfg[key];
  }

  /**
   * Get property
   * @param {String} path
   * @return {*}
   */
  get(path) {
    let [cfg, key] = this._handle(path);

    return cfg[key];
  }

  /**
   * Delete property
   * @param {String} path
   */
  del(path) {
    let [cfg, key] = this._handle(path);

    delete cfg[key];
  }

  /**
   * Find all provided keys and apply transform function
   * @param {String} key
   * @param {Function} cb
   */
  transform(key, cb) {
    let keys = this._findKeys(key);

    keys.forEach(key => {
      cb(key, this.get(key));
    });
  }

  /**
   * Find all keys
   * @param {String} key
   * @param {Object} object
   * @param {Array} crumbs
   * @param {Array} results
   * @return {Array}
   * @private
   */
  _findKeys(key, object = this._table, crumbs = [], results = []) {
    const property = [...crumbs, key].join(this._separator);

    if (this.has(property)) {
      results.push(property);
    }

    Object.keys(object).forEach(prop => {
      let value = object[prop];
      if (value && value.constructor === Object) {
        this._findKeys(key, value, crumbs.concat(prop), results);
      }
    });

    return results;
  }

  /**
   * Handle multilevel object
   * @param {String|Array} path
   * @param {Object} object
   * @return {Array}
   * @private
   */
  _handle(path, object = this._table) {
    let crumbs = path.constructor === Array ? path : path.split(this._separator);
    let property = crumbs[0];

    if (crumbs.length <= 1) {
      return [object, property];
    }

    if (!object.hasOwnProperty(property)) {
      object[property] = {};
    }

    return this._handle(crumbs.slice(1), object[property]);
  }
}

module.exports = HashTable;
