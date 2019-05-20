'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyAuto extends AbstractDependencyStrategy {

  /**
   * Returns updated config object with included dependencies
   * @param {Object} fullConfig 
   * @param {Function<boolean>[]} filters 
   * @returns {Object}
   */
  getExecutionList(fullConfig, filters) {
    return super.getExecutionList(fullConfig, filters);
  }
}

module.exports = DependencyAuto;