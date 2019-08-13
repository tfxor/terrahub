'use strict';

const ApiHelper = require('../api-helper');
const Dictionary = require('../dictionary');
/**
 * @abstract Class
 */
class Distributor {
  /**
   * @param {Object} command
   */
  constructor(command) {
    this.command = command;
    this.runId = command._runId;
    this.logger = command.logger;
    this.tokenIsValid = command._tokenIsValid; //@todo - undefined
  }

  /**
   * @return {Promise}
   */
  async run() {
    await this.command.validate();
    await this.sendLogsToApi();

    const result = await this.command.run();

    if (!result) { //todo refactor !
      return Promise.resolve();
    }

    if (result && !Array.isArray(result)) { // todo project.js return {String}
      return Promise.resolve(result);
    }

    const steps = result.filter(step => Boolean(step));

    try {
      for (const step of steps) {
        const { actions, config, postActionFn, ...options } = step;

        if (config) {
          this.projectConfig = config;

          const firstKey = Object.keys(this.projectConfig)[0];
          this._projectRoot = this.projectConfig[firstKey].project.root;

        }

        const result = await this.runActions(actions, options);

        if (postActionFn) {
          return postActionFn(result);
        }
      }
    } catch (err) {
      console.error(err);
    }

    await ApiHelper.sendMainWorkflow({ status: 'update' });

    return Promise.resolve('Done');
  }

  /**
   * @param {Number} direction
   * @return {Object}
   * @protected
   */
  buildDependencyTable(direction) {
    const keys = Object.keys(this.projectConfig);

    const result = keys.reduce((acc, key) => {
      acc[key] = {};

      return acc;
    }, {});

    switch (direction) {
      case Dictionary.DIRECTION.FORWARD:
        keys.forEach(key => {
          Object.assign(result[key], this.projectConfig[key].dependsOn);
        });
        break;

      case Dictionary.DIRECTION.REVERSE:
        keys.forEach(key => {
          Object.keys(this.projectConfig[key].dependsOn).forEach(hash => {
            result[hash][key] = null;
          });
        });
        break;
    }

    return result;
  }

  /**
   * Remove dependencies on this component
   * @param {Object} dependencyTable
   * @param {String} hash
   * @protected
   */
  removeDependencies(dependencyTable, hash) {
    Object.keys(dependencyTable).forEach(key => {
      delete dependencyTable[key][hash];
    });
  }

  /**
   * @param {String[]} actions
   * @param {Object} options
   * @return {Promise}
   * @abstract
   */
  runActions(actions, options = {}) {
    throw new Error('Method must be implemented.');
  }

  /**
   * @return {Promise}
   */
  async sendLogsToApi() {
    ApiHelper.setToken(this.command._tokenIsValid);

    const environment = this.command.getOption('env') ? this.command.getOption('env') : 'default';
    const projectConfig = this.command.getProjectConfig();

    return ApiHelper.sendMainWorkflow({
      status: 'create',
      runId: this.command.runId,
      commandName: this.command._name,
      project: projectConfig,
      environment: environment,
    });
  }
}

module.exports = Distributor;