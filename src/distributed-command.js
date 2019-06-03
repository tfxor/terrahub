'use strict';

const ConfigCommand = require('./config-command');
const Distributor = require('./helpers/distributors/thread-distributor');
const CloudDistributor = require('./helpers/distributors/cloud-distributor');

/**
 * @abstract
 */
class DistributedCommand extends ConfigCommand {

  initialize() {
    super.initialize();

    this
      .addOption('git-diff', 'g', 'List of components to include (git diff)', Array, [])
      .addOption('var', 'r', 'Variable(s) to be used by terraform', Array, [])
      .addOption('var-file', 'l', 'Variable file(s) to be used by terraform', Array, [])
    ;
  }

  getDistributor(config) {
    if (!this.distributor) {
      this.distributor = new Distributor(config);
    }

    return this.distributor;
  }

  getCloudDistributor(config) {
    if (!this.cloudDistributor) {
      this.cloudDistributor = new CloudDistributor(config);
    }

    return this.cloudDistributor;
  }

  _filters() {
    const filters = super._filters();
    const gitDiff = this.getOption('git-diff');

    return [...filters, gitDiff.length ? hash => gitDiff.includes(hash) : null].filter(Boolean);
  }

  get cliParams() {
    return {
      terraform: {
        var: this.getOption('var'),
        varFile: this.getOption('var-file')
      }
    };
  }

  stopExecution() {
    super.stopExecution();

    if (this.distributor) {
      return this.distributor.disconnect();
    }

  }
}

module.exports = DistributedCommand;