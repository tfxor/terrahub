'use strict';
const logger = require('js-logger');

/**
 * @interface
 */
class DependencyStrategy {
  /**
   *
   * @param {Object} config
   * @param {Object} fullConfig
   * @param {Array} dependencies
   */
  constructor(config, fullConfig, dependencies) {
    this.logger = logger;
    this.config = config;
    this.fullConfig = fullConfig;
    this.dependencies = dependencies;
  }

  execute() {
    throw new Error('Strategy#execute needs to be overridden.');
  }
}

module.exports = DependencyStrategy;