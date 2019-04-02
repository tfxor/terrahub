'use strict';

const logger = require('../logger');
const { fetch } = require('../../parameters');
const AbstractDistributor = require('./abstract-distributor');

class CloudDistributor extends AbstractDistributor {
  /**
   * @param {Object} configObject
   * @param {String} thubRunId
   */
  constructor(configObject, thubRunId) {
    super(configObject, { thubRunId });

    this._errors = [];
  }

  /**
   * @param {String[]} actions
   * @param {Number} dependencyDirection
   * @return {Promise}
   * @override
   */
  runActions(actions, { dependencyDirection = null } = {}) {
    let inProgress = 0;
    const results = [];
    this._dependencyTable = this.buildDependencyTable(this.config, dependencyDirection);
    this.TERRAFORM_ACTIONS = actions;

    return new Promise((resolve, reject) => {
      /**
       * @private
       */
      const _distributeConfigs = () => {
        Object.keys(this._dependencyTable).forEach(hash => {
          const dependencies = this._dependencyTable[hash];

          if (!Object.keys(dependencies).length) {
            delete this._dependencyTable[hash];

            _callLambdaExecutor(hash);
          }
        });
      };

      /**
       * @param {String} hash
       * @private
       */
      const _callLambdaExecutor = hash => {
        const config = this.config[hash];

        const body = JSON.stringify({
          actions: this.TERRAFORM_ACTIONS,
          thubRunId: this.THUB_RUN_ID,
          config: config
        });

        inProgress++;

        logger.warn(`[${config.name}] Deploy started!`);
        fetch.post('thub/deploy/create', { body: body })
          .then(res => {
            results.push(res);
            this.removeDependencies(this._dependencyTable, hash);

            logger.info(`[${config.name}] Successfully deployed!`);

            return Promise.resolve();
          })
          .catch(error => {
            this._dependencyTable = {};
            this._errors.push(error);

            return Promise.resolve();
          })
          .then(() => {
            inProgress--;

            if (Object.keys(this._dependencyTable).length) {
              _distributeConfigs();
            } else if (!inProgress) {
              if (this._errors.length) {
                return reject(this._errors);
              }

              return resolve(results);
            }
          });
      };

      _distributeConfigs();
    });
  }
}

module.exports = CloudDistributor;
