'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyIgnore extends AbstractDependencyStrategy {

  /**
   * Returns updated config object without inexistent dependencies
   * @param {Object} fullConfig 
   * @param {Function<boolean>[]} filters 
   * @returns {Object}
   */
  getExecutionList(fullConfig, filters) {
    const config = super.getExecutionList(fullConfig, filters);
    const issues = {};

    Object.keys(fullConfig).forEach(it => { issues[it] = []; });

    Object.keys(config).forEach(hash => {
      const node = config[hash];
      const _dependsOn = {};

      Object.keys(node.dependsOn).forEach(it => {
        if (!config.hasOwnProperty(it)) {
          issues[it].push(hash);
        } else {
          _dependsOn[it] = null;
        }
      });
      
      config[hash].dependsOn = _dependsOn;
    });

    Object.keys(issues).filter(it => issues[it].length).forEach(it => {
      const names = issues[it].map(it => fullConfig[it].name);

      console.log(`TerraHub component '${fullConfig[it].name}' ` +
        `that is dependecy of '${names.join(`', '`)}' was excluded from config`);
    });

    return config;
  }
}

module.exports = DependencyIgnore;
