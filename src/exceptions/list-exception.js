'use strict';

const os = require('os');

class ListException extends Error {
  /**
   * @param {String} title
   * @param {String[]} issues
   * @param {Number} style
   */
  constructor(title, issues, style = ListException.EMPTY) {
    let errorStrings;

    switch (style) {
      case ListException.DASH:
        errorStrings = issues.map(it => ` - ${it}`);
        break;

      case ListException.NUMBER:
        errorStrings = issues.map((it, index) => `${index + 1}. ${it}`);
        break;

      case ListException.EMPTY:
      default:
        errorStrings = issues;
        break;
    }
    errorStrings.unshift(title);

    super(errorStrings.join(os.EOL));
  }

  static get EMPTY() {
    return 0;
  }

  static get DASH() {
    return 1;
  }

  static get NUMBER() {
    return 2;
  }
}

module.exports = ListException;
