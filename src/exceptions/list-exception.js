'use strict';

const os = require('os');

class ListException extends Error {
  /**
   * @param {String[]} issues
   * @param {String} header
   * @param {String} footer
   * @param {Number} style
   */
  constructor(issues, { header = null, footer = null, style = ListException.EMPTY } = {}) {
    let errors;

    switch (style) {
      case ListException.DASH:
        errors = issues.map(it => ` - ${it}`);
        break;

      case ListException.NUMBER:
        errors = issues.map((it, index) => `${index + 1}. ${it}`);
        break;

      case ListException.EMPTY:
      default:
        errors = issues;
        break;
    }

    const errorMessage = [header, ...errors, footer].filter(Boolean).join(os.EOL);

    super(errorMessage);
  }

  /**
   * @return {Number}
   */
  static get EMPTY() {
    return 0;
  }

  /**
   * @return {Number}
   */
  static get DASH() {
    return 1;
  }

  /**
   * @return {Number}
   */
  static get NUMBER() {
    return 2;
  }
}

module.exports = ListException;
