'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyIgnore extends AbstractDependencyStrategy {

    setStrategy(config) {
        return config;
    }

    getExecutionList() {
        return this.setStrategy();
    }
}

module.exports = DependencyIgnore;