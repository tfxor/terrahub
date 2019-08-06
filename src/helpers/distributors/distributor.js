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
    const result = await this.command.run();

    console.log(result, typeof result);

    if (!result) { //todo refactor !
      return Promise.resolve();
    }

    if (result && !Array.isArray(result)) { // todo project.js return {String}
      return Promise.resolve(result);
    }

    const steps = result.filter(step => Boolean(step));

    try { //todo Does need try ?
      for (const step of steps) {
        const { actions, config, postActionFn, ...options } = step;

        if (config) {
          this.projectConfig = config;

          const firstKey = Object.keys(this.projectConfig)[0];
          this._projectRoot = this.projectConfig[firstKey].project.root;

        }

         const result = await this.runActions(actions, options);

        if (postActionFn) {
          return postActionFn(result)
        }
      }
    } catch (err) {
      console.error(err);
    }

    return Promise.resolve('Done');
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