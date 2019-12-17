'use strict';

class NotFoundException extends Error {
  /**
   * @param {String} issue
   */
  constructor(issue) {
    super(issue);

    this.errorType = 'NotFoundException';
  }
}

module.exports = NotFoundException;
