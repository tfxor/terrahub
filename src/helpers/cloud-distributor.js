'use strict';

const logger = require('./logger');
const Dictionary = require('./dictionary');
const { fetch } = require('../parameters');

class CloudDistributor {
  /**
   * @param {Object} configObject
   * @param {String} thubRunId
   */
  constructor(configObject, thubRunId) {
    this.THUB_RUN_ID = thubRunId;
    this._config = Object.assign({}, configObject);
    this._errors = [];
  }

  /**
   * @param {Object} config
   * @param {Number} direction
   * @return {Object}
   * @private
   */
  _buildDependencyTable(config, direction) {
    const keys = Object.keys(config);

    const result = keys.reduce((acc, key) => {
      acc[key] = {};

      return acc;
    }, {});

    switch (direction) {
      case Dictionary.DIRECTION.FORWARD:
        keys.forEach(key => {
          Object.assign(result[key], config[key].dependsOn);
        });
        break;

      case Dictionary.DIRECTION.REVERSE:
        keys.forEach(key => {
          Object.keys(config[key].dependsOn).forEach(hash => {
            result[hash][key] = null;
          });
        });
        break;
    }

    return result;
  }

  /**
   * Remove dependencies on this component
   * @param {String} hash
   * @private
   */
  _removeDependencies(hash) {
    Object.keys(this._dependencyTable).forEach(key => {
      delete this._dependencyTable[key][hash];
    });
  }

  /**
   * @param {String[]} actions
   * @param {Object} options
   * @return {Promise}
   */
  runActions(actions, options = {}) {
    const {
      dependencyDirection = null
    } = options;

    let inProgress = 0;
    const results = [];
    this._dependencyTable = this._buildDependencyTable(this._config, dependencyDirection);
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
        const config = this._config[hash];

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
            this._removeDependencies(hash);

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
