'use strict';

class MemberAccessor {
  /**
   * Constructor
   * @param {Object} object
   * @param {String} separator
   */
  constructor(object, separator = '.') {
    this._object = object;
    this._separator = separator;
  }

  /**
   * Get raw object
   * @return {Object}
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
   * Handle multilevel object
   * @param {String|Array} path
   * @param {Object} object
   * @return {Array}
   * @private
   */
  _handle(path, object = this._object) {
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

module.exports = MemberAccessor;
