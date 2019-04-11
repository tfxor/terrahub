'use strict';

const logger = require('../logger');
const S3Helper = require('../s3-helper');
const { fetch, config } = require('../../parameters');
const AbstractDistributor = require('./abstract-distributor');

class CloudDistributor extends AbstractDistributor {
  /**
   * @param {Object} configObject
   */
  constructor(configObject) {
    super(configObject);

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
    const s3Helper = new S3Helper();
    const bucketName = S3Helper.METADATA_BUCKET;
    const s3directory = config.api.replace('api', 'projects');

    this._dependencyTable = this.buildDependencyTable(this.config, dependencyDirection);

    return this._fetchAccountId()
      .then(accountId => {
        logger.warn('Uploading project to S3.');

        return s3Helper.uploadDirectory(
          this._getProjectPath(),
          bucketName,
          [s3directory, accountId, this.THUB_RUN_ID].join('/'),
          { exclude: ['**/node_modules/**', '**/.terraform/**', '**/.git/**'] }
        );
      })
      .then(() => {
        logger.warn('Directory uploaded to S3.');

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
              .then(() => {
                this.removeDependencies(this._dependencyTable, hash);

                logger.info(`[${config.name}] Successfully deployed!`);
              })
              .catch(error => {
                this._dependencyTable = {};
                this._errors.push(error);
              })
              .then(() => {
                inProgress--;

                if (Object.keys(this._dependencyTable).length) {
                  _distributeConfigs();
                } else if (!inProgress) {
                  if (this._errors.length) {
                    return reject(this._errors);
                  }

                  return resolve();
                }
              });
          };

          _distributeConfigs();
        });
      });
  }

  /**
   * @return {String}
   * @private
   */
  _getProjectPath() {
    const key = Object.keys(this.config)[0];

    return this.config[key].project.root;
  }

  /**
   * @return {Promise<String>}
   * @private
   */
  _fetchAccountId() {
    return fetch.get('thub/account/retrieve').then(json => Promise.resolve(json.data.id));
  }
}

module.exports = CloudDistributor;
