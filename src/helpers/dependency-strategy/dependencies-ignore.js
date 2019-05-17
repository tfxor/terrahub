'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyIgnore extends AbstractDependencyStrategy {

    setStrategy(config) {
        return config;
    }

    getExecutionList(config, fullConfig, filters) {
        super.getExecutionList(config, fullConfig, filters);
        const issues = [...Object.keys(config)];

        Object.keys(config).forEach(hash => {
            const node = config[hash];
            const _dependsOn = {};
            Object.keys(node.dependsOn).forEach(it => {
                if(!config.hasOwnProperty(it)) {
                    issues[it] = hash;
                } else {
                    _dependsOn[it] = null;
                }

                config[hash].dependsOn = _dependsOn;
            });
        });

        return config;
    }
}

module.exports = DependencyIgnore;