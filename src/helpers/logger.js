'use strict';

class Logger {
  /**
   * @param {String} message
   */
  static log(...message) {
    this._log(this.LOG, ...arguments);
  }

  /**
   * @param {String} message
   */
  static info(...message) {
    this._log(this.INFO, ...arguments);
  }

  /**
   * @param {String} message
   */
  static error(...message) {
    this._log(this.ERROR, ...arguments);
  }

  /**
   * Raw output
   * @param {String} message
   */
  static raw(...message) {
    console.log(...arguments);
  }

  /**
   * @param {String} type
   * @param {String} message
   * @private
   */
  static _log(type, ...message) {
    switch (type) {
      case this.LOG:
        this.raw('✅ ', ...message);
        break;
      case this.INFO:
        this.raw('💡 ', ...message);
        break;
      case this.ERROR:
        this.raw('❌ ', ...message);
        break;
    }
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get LOG() {
    return 'log';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get INFO() {
    return 'info';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get ERROR() {
    return 'error';
  }
}

module.exports = Logger;
