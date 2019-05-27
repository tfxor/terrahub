'use strict';

const os = require('os');

class AuthorizationException extends Error {
  /**
   * @param {String} issue
   */
  constructor(issue = 'Provided THUB_TOKEN is not valid.') {
    const header = 'Authorization error:';
    const errorMessage = [header, issue].filter(Boolean).join(os.EOL);

    super(errorMessage);
  }
}

module.exports = AuthorizationException;
