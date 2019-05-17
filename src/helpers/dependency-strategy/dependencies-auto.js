'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyAuto extends AbstractDependencyStrategy {

    setStrategy(config) {
        return config;
    }

    getExecutionList(config, fullConfig, filters) {
        super.getExecutionList(config, fullConfig, filters);
        return config;
    }
}

module.exports = DependencyAuto;