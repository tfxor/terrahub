'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyAuto extends AbstractDependencyStrategy {

    setStrategy(config) {
        return config;
    }

    getExecutionList() {
        return this.setStrategy();
    }
}

module.exports = DependencyAuto;