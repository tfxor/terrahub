'use strict';

const Dictionary = require('../dictionary');
const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyInclude extends AbstractDependencyStrategy {

  /**
   * Returns updated config object with included dependencies
   * @param {Object} fullConfig
   * @param {Function<boolean>[]} filters
   * @param {Number} direction
   * @returns {Object}
   */
  getExecutionList(fullConfig, filters, direction) {
    const config = super.getExecutionList(fullConfig, filters);
    const hashesToCheck = Object.keys(config);
    const _newComponents = {};
    const checked = { ...config };
    const issues = {};

    let result = {};

    Object.keys(fullConfig).forEach(it => { issues[it] = []; });

    if (direction - 1 === Dictionary.DIRECTION.REVERSE) {
      const destroy = {};

      while (hashesToCheck.length) {
        const hash = hashesToCheck.pop();
  
        Object.keys(fullConfig)
          .filter(it => {
            const { dependsOn } = fullConfig[it];
  
            return Object.keys(dependsOn).includes(hash);
          })
          .filter(it => !config.hasOwnProperty(it))
          .forEach(it => {
            issues[it].push(hash);
            destroy[it] = fullConfig[it];
  
            if (!checked.hasOwnProperty(it)) {
              checked[it] = null;
              hashesToCheck.push(it);
            }
          });
      }

      result = { ...destroy, ...config };
    }

    if (direction - 1 !== Dictionary.DIRECTION.REVERSE) {
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

      result = { ...config, ..._newComponents };
    }

    Object.keys(issues).filter(it => issues[it].length).forEach(hash => {
      const names = issues[hash].map(it => fullConfig[it].name);

      console.log(`Terrahub added '${fullConfig[hash].name}' component that is dependency of ` +
        `'${names.join(`', '`)}' component${names.length > 1 ? 's' : ''}`);
    });

    return result;
  }
}

module.exports = DependencyInclude;
