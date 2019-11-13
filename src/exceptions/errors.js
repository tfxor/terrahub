'use strict';

class SpawnError extends Error {
  constructor(error, stderr) {
    super();
    this.error = error;
    this.message = Buffer.concat(stderr).toString();
  }
}

module.exports = {
  SpawnError
};
