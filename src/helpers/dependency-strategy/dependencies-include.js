'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyInclude extends AbstractDependencyStrategy {

  /**
   * Returns updated config object with included dependencies
   * @param {Object} fullConfig
   * @param {Function<boolean>[]} filters
   * @returns {Object}
   */
  getExecutionList(fullConfig, filters) {
    const config = super.getExecutionList(fullConfig, filters);
    const hashesToCheck = Object.keys(config);
    const _newComponents = {};
    const checked = { ...config };
    const issues = {};

    Object.keys(fullConfig).forEach(it => { issues[it] = []; });

    while (hashesToCheck.length) {
      const hash = hashesToCheck.pop();
      const { dependsOn } = fullConfig[hash];

      Object.keys(dependsOn).forEach(it => {
        if (!checked.hasOwnProperty(it)) {
          hashesToCheck.push(it);
          checked[it] = null;
        }
        if (!config.hasOwnProperty(it)) {
          _newComponents[it] = fullConfig[it];
          issues[it].push(hash);
        }
      });
    }

    Object.keys(issues).filter(it => issues[it].length).forEach(hash => {
      const names = issues[hash].map(it => fullConfig[it].name);

      console.log(`Terrahub added '${fullConfig[hash].name}' component that is dependency of ` +
        `'${names.join(`' ,'`)}' component${names.length > 1 ? 's' : ''}`);
    });

    return { ...config, ..._newComponents };
  }
}

module.exports = DependencyInclude;
