'use strict';

const Dictionary = require('../dictionary');

/**
 * @abstract Class
 */
class Distributor {
  /**
   * @param {Object} command
   */
  constructor(command) {
    this.command = command;
    this.runId = command._runId;
    this.logger = command.logger;
    this.tokenIsValid = command._tokenIsValid; //@todo - undefined
  }

  /**
   * @return {Promise}
   */
  async runCommand() {
    const validation = await this.command.validate();
    const [config, actions] = await this.command.run();

    this.projectConfig = config;

    const firstKey = Object.keys(this.projectConfig)[0];
    this._projectRoot = this.projectConfig[firstKey].project.root;

    return this.runActions(actions, { dependencyDirection: Dictionary.DIRECTION.FORWARD });
  }

  /**
   * @param {Number} direction
   * @return {Object}
   * @protected
   */
  buildDependencyTable(direction) {
    const keys = Object.keys(this.projectConfig);

    const result = keys.reduce((acc, key) => {
      acc[key] = {};

      return acc;
    }, {});

    switch (direction) {
      case Dictionary.DIRECTION.FORWARD:
        keys.forEach(key => {
          Object.assign(result[key], this.projectConfig[key].dependsOn);
        });
        break;

      case Dictionary.DIRECTION.REVERSE:
        keys.forEach(key => {
          Object.keys(this.projectConfig[key].dependsOn).forEach(hash => {
            result[hash][key] = null;
          });
        });
        break;
    }

    return result;
  }

  /**
   * Remove dependencies on this component
   * @param {Object} dependencyTable
   * @param {String} hash
   * @protected
   */
  removeDependencies(dependencyTable, hash) {
    Object.keys(dependencyTable).forEach(key => {
      delete dependencyTable[key][hash];
    });
  }

  runActions() {
    throw new Error('Method must be implemented.');
  }
}

module.exports = Distributor;