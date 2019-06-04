'use strict';

const Args = require('./helpers/args-parser');
const GitHelper = require('./helpers/git-helper');
const ConfigCommand = require('./config-command');
const Distributor = require('./helpers/distributors/thread-distributor');
const CloudDistributor = require('./helpers/distributors/cloud-distributor');

/**
 * @abstract
 */
class DistributedCommand extends ConfigCommand {

  /**
   * Command initialization
   * (post configure action)
   */
  initialize() {
    super.initialize();

    this
      .addOption('git-diff', 'g', 'List of components to include (git diff)', Array, [])
      .addOption('var', 'r', 'Variable(s) to be used by terraform', Array, [])
      .addOption('var-file', 'l', 'Variable file(s) to be used by terraform', Array, [])
    ;
  }

  /**
   * @param {Object} config
   * @returns {ThreadDistributor}
   */
  getDistributor(config) {
    if (!this.distributor) {
      this.distributor = new Distributor(config);
    }

    return this.distributor;
  }

  /**
   * @param {Object} config
   * @returns {CloudDistributor}
   */
  getCloudDistributor(config) {
    if (!this.cloudDistributor) {
      this.cloudDistributor = new CloudDistributor(config);
    }

    return this.cloudDistributor;
  }

  /**
   *
   * @returns {Function[]}
   * @private
   */
  _filters() {
    const filters = super._filters();
    const gitDiff = this.getGitDiff();

    return [...filters, gitDiff.length ? hash => gitDiff.includes(hash) : null].filter(Boolean);
  }
  /**
   * @description Returns an array of hashes to include in the execution
   * @returns {String[]}
   */
  getGitDiff() {
    const commits = this.getOption('git-diff');

    if (!commits.length) {
      return [];
    } else if (commits.length > 2) {
      throw new Error('Invalid \'--git-diff\' option format! More than two arguments specified!');
    }

    const diffList = GitHelper.getGitDiff(commits, this.getAppPath());

    const config = super.getConfig();
    const result = {};

    Object.keys(config)
      .filter(hash => {
        const { mapping } = config[hash];

        return mapping && mapping.some(dep => diffList.some(diff => diff.startsWith(dep)));
      })
      .forEach(hash => { result[hash] = null; });

    // Add components' dependencies to the execution list
    let newHashes = Object.keys(result);

    while (newHashes.length) {
      const componentHash = newHashes.pop();
      const { dependsOn } = config[componentHash];

      dependsOn
        .map(path => ConfigLoader.buildComponentHash(path))
        .filter(hash => !result.hasOwnProperty(hash))
        .forEach(hash => {
          newHashes.push(hash);
          result[hash] = null;
        });
    }

    return Object.keys(result);
  }
  /**
   * @returns {Array}
   */
  getVarFile() {
    return this.getOption('var-file');
  }

  /**
   * @returns {Object}
   */
  getVar() {
    let result = {};

    this.getOption('var').map(item => {
      Object.assign(result, Args.toObject(item));
    });

    return result;
  }

  /**
   * @returns {Object}
   */
  get cliParams() {
    return {
      terraform: {
        var: this.getVar(),
        varFile: this.getVarFile()
      }
    };
  }

  /**
   * Gracefully exit killing all processes
   * @returns {void}
   */
  stopExecution() {
    console.log('init stopExecution', !!this.distributor);
    super.stopExecution();

    if (this.distributor) {
      return this.distributor.disconnect();
    }

  }
}

module.exports = DistributedCommand;