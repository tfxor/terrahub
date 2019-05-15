'use strict';

const ConfigLoader = require('../../config-loader');
const DependencyStrategy = require('./dependency-strategy');

class DependencyInclude extends DependencyStrategy {

  execute() {
    const config = this.config;
    const dependencies = this.dependencies;
    let checked = Object.assign({}, this.config);
    let issues = {};

    while(dependencies.length) {
      const hash = dependencies.pop();
      const { dependsOn, name } = this.fullConfig[hash];

      dependsOn
        .map(it => ConfigLoader.buildComponentHash(it))
        .forEach(it => {
          if(!dependencies[it] && !checked.hasOwnProperty(it)) {
            dependencies.push(it);
            checked[it] = null;
          }
        });

      config[hash] = this.fullConfig[hash];
      issues[name] = dependsOn;
    }

    Object.keys(issues).forEach(it => {
      this.logger.log(`TerraHub added to config '${it}' component that has ${issues[it].length > 0 ? `'${issues[it].join(`' ,'`)}' as` : 'no'} dependencies`);
    });

    return Object.assign(this.config, config);
  }
}

module.exports = DependencyInclude;