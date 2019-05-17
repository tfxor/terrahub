'use strict';

const AbstractDependencyStrategy = require('./absract-dependecy-strategy');

class DependencyInclude extends AbstractDependencyStrategy {

    setStrategy(config) {
        return config;
    }

    getExecutionList(config, fullConfig, filters) {
        super.getExecutionList(config, fullConfig, filters);

        const hashesToCheck = [...Object.keys(config)];
        const _newComponents = {};
        const checked = {};
        const issues = [];

        Object.keys(fullConfig).forEach(hash => {
            const { dependsOn } = fullConfig[hash];

            Object.keys(dependsOn).forEach(it => {
                if(!config.hasOwnProperty(it) && !checked.hasOwnProperty(it)) {
                    hashesToCheck.push(it)
                    checked[it] = null;
                }
            })
        });

        while (hashesToCheck.length) {
            const hash = hashesToCheck.pop();
            
            if(!config.hasOwnProperty(hash)) {
                _newComponents[hash] = fullConfig[hash];
                issues.push(hash);
            }
        }

        console.log(`Terrahub added : ${issues.map(it => `'${fullConfig[it].name}'`)} components`);
        const result = Object.assign({}, config, _newComponents);
        
        return result;
    }
}

module.exports = DependencyInclude;