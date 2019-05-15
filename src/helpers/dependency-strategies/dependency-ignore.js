'use strict';
const DependencyStrategy = require('./dependency-strategy');

class DependencyIgnore extends DependencyStrategy {

  execute() {
    const config = this.config;
    const dependencies = this.dependencies;
    let issues = {};

    Object.keys(config).forEach(it => { issues[config[it].name] = []; });

    while (dependencies.length) {
      const hash = dependencies.pop();

      Object.keys(config).forEach(it => {
        const { dependsOn, name } = config[it];

        if (dependsOn.hasOwnProperty(hash)) {
          issues[name].push(hash);
          delete dependsOn[hash];
          delete this.fullConfig[it].dependsOn[hash];
        }

      });
    }

    Object.keys(issues).forEach(it => {
      const names = issues[it].map(it => this.fullConfig[it].name);
      this.logger.log(`TerraHub deleted '${names.join(`', '`)}' from '${it}' component config.`);
    });

    return config;
  }
}

module.exports = DependencyIgnore;