'use strict';

class AuthenticationException extends Error {
  /**
   * @param {String} issue
   */
  constructor(issue) {
    super(issue);

    this.errorType =  'AuthenticationException';
  }
}

module.exports = AuthenticationException;
