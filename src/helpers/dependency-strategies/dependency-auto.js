'use strict';
const DependencyStrategy = require('./dependency-strategy');


class DependencyAuto extends DependencyStrategy {

  execute() {
    console.log('implemented Auto strategy');
    return this.config;
  }
}

module.exports = DependencyAuto;