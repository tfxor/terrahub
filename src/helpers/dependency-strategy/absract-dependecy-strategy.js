'use strict';

class AbstractDependencyStrategy {

  /**
   * Returns filtered config
   * @param {Object} fullConfig 
   * @param {Function<boolean>[]} filters 
   * @returns {Object}
   */
  getExecutionList(fullConfig, filters) {
    const config = Object.assign({}, fullConfig);

    Object.keys(config)
      .filter(hash => filters.some(check => !check(hash)))
      .forEach(hash => { delete config[hash]; });

    return config;
  }
}

module.exports = AbstractDependencyStrategy;
