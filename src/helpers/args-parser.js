'use strict';

const parseArgs = require('minimist');

class ArgsParser {
  /**
   * Parse CLI arguments/options
   * @param {Array} args
   * @returns {*}
   */
  static parse(args) {
    return parseArgs(args);
  }

  /**
   * Convert complex options
   * @param {Boolean|Number|Array|Object} type
   * @param {String|Boolean} value
   * @returns {*}
   */
  static convert(type, value) {
    if (value === undefined || value.constructor === type) {
      return value;
    }

    if (type !== Boolean && value.constructor === Boolean) {
      return undefined;
    }

    let result = value;

    switch (type) {
      case Boolean:
        result = this.toBoolean(value);
        break;
      case Number:
        result = this.toNumber(value);
        break;
      case Array:
        result = this.toArray(value);
        break;
      case Object:
        result = this.toObject(value);
        break;
    }

    return result;
  }

  /**
   * @param {String} value
   * @returns {Boolean}
   */
  static toBoolean(value) {
    return !!value;
  }

  /**
   * @param {String} value
   * @returns {Number}
   */
  static toNumber(value) {
    return parseFloat(value);
  }

  /**
   * @param {String} value
   * @param {String} separator
   * @returns {Array}
   */
  static toArray(value, separator = ',') {
    const str = value.toString();
    const json = this.tryJson(str);

    return json ? json : str.split(separator).filter(x => !/^\s*$/.test(x)).map(x => ArgsParser.trim(x));
  }

  /**
   * @param {String} value
   * @returns {Object}
   */
  static toObject(value) {
    let result = {};
    let json = this.tryJson(value);

    if (json) {
      return json;
    }

    this.toArray(value).forEach(chunk => {
      let [key, value] = ArgsParser.toArray(chunk, ':');
      result[key] = value;
    });

    return result;
  }

  /**
   * Try to parse JSON, returns false on error
   * @param {String} string
   * @returns {*}
   */
  static tryJson(string) {
    try {
      return isNaN(parseInt(string)) ? JSON.parse(string) : false;
    } catch (e) {
      return false;
    }
  }

  /**
   * @param {String} value
   * @returns {String}
   */
  static trim(value) {
    let leading = new RegExp('^([\\s\'"]*)', 'g');
    let trailing = new RegExp('([\\s\'"]*)$', 'g');

    return value.trim().replace(leading, '').replace(trailing, '');
  }
}

module.exports = ArgsParser;
