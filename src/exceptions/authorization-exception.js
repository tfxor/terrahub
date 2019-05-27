'use strict';

class AuthorizationException extends Error {
  /**
   * @param {String} issue
   */
  constructor(issue = 'Please provide valid THUB_TOKEN.') {
    super(issue);

    this.errorType =  'AuthorizationException';
  }
}

module.exports = AuthorizationException;
