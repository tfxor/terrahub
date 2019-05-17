'use strict';

class AbstractDependencyStrategy {

    setStrategy() {
        throw new Error('DependencySetStrategy must be overwritten!')
    }

    getExecutionList(config, fullConfig, filters) {
        Object.keys(config)
        .filter(hash => filters.some(check => !check(hash)))
        .forEach(hash => { delete config[hash]; });
    }
}

module.exports = AbstractDependencyStrategy;