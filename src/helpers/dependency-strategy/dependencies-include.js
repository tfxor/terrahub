'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyInclude extends AbstractDependencyStrategy {

    setStrategy(config) {
        return config;
    }

    getExecutionList() {
        return this.setStrategy();
    }
}

module.exports = DependencyInclude;