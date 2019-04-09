'use strict';

const { uuid } = require('../util');
const Dictionary = require('../dictionary');

class AbstractDistributor {
  /**
   * @param {Object} configObject
   * @param {String} thubRunId
   */
  constructor(configObject, { thubRunId = uuid() } = {}) {
    this.THUB_RUN_ID = thubRunId;
    this.config = Object.assign({}, configObject);
  }

  /**
   * @param {Object} config
   * @param {Number} direction
   * @return {Object}
   * @protected
   */
  buildDependencyTable(config, direction) {
    const keys = Object.keys(config);

    const result = keys.reduce((acc, key) => {
      acc[key] = {};

      return acc;
    }, {});

    switch (direction) {
      case Dictionary.DIRECTION.FORWARD:
        keys.forEach(key => {
          Object.assign(result[key], config[key].dependsOn);
        });
        break;

      case Dictionary.DIRECTION.REVERSE:
        keys.forEach(key => {
          Object.keys(config[key].dependsOn).forEach(hash => {
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

  /**
   * @param {String[]} actions
   * @return {Promise}
   * @abstract
   */
  runActions(actions, {} = {}) {
    throw new Error('runActions requires implementation');
  }
}

module.exports = AbstractDistributor;
