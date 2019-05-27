'use strict';

class AuthorizationException extends Error {
  /**
   * @param {String} issue
   */
  constructor(issue = 'Provided THUB_TOKEN is not valid.') {
    super(issue);

    this.errorType =  'AuthorizationException';
  }
}

module.exports = AuthorizationException;
