'use strict';

class AuthorizationException extends Error {
  /**
   * @param {String} issue
   */
  constructor(issue) {
    super(issue);

    this.errorType =  'AuthorizationException';
  }
}

module.exports = AuthorizationException;
