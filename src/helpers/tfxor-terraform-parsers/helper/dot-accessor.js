'use strict';

const has = Object.prototype.hasOwnProperty;

class DotAccessor {
  /**
   * Constructor
   * @param {Object} object
   * @param {String} separator
   */
  constructor(object = {}, separator = '.') {
    this._object = object;
    this._separator = separator;
  }

  /**
   * Get raw object
   * @returns {Object}
   */
  getRaw() {
    return this._object;
  }

  /**
   * Ser property
   * @param {String} path
   * @param {*} value
   */
  set(path, value) {
    const [cfg, key] = this._handle(path);

    cfg[key] = value;
  }

  /**
   * Get property
   * @param {String} path
   * @returns {Boolean}
   */
  has(path) {
    const [cfg, key] = this._handle(path);

    return has.call(cfg, key);
  }

  /**
   * Get property
   * @param {String} path
   * @returns {*}
   */
  get(path) {
    const [cfg, key] = this._handle(path);

    return cfg[key];
  }

  /**
   * Delete property
   * @param {String} path
   */
  del(path) {
    const [cfg, key] = this._handle(path);

    delete cfg[key];
  }

  /**
   * Handle multilevel object
   * @param {String|Array} path
   * @param {Object} object
   * @returns {Array}
   * @private
   */
  _handle(path, object = this._object) {
    const obj = object;

    const crumbs = path.constructor === Array ? path : path.split(this._separator);
    const property = crumbs[0];

    if (crumbs.length <= 1) {
      return [obj, property];
    }

    if (!has.call(obj, property)) {
      obj[property] = {};
    }

    return this._handle(crumbs.slice(1), obj[property]);
  }
}

module.exports = DotAccessor;
