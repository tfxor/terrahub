'use strict';

const fse = require('fs-extra');
const { join } = require('path');
const logger = require('../logger');
const S3Helper = require('../s3-helper');
const { globPromise } = require('../util');
const ConfigLoader = require('../../config-loader');
const { fetch, config } = require('../../parameters');
const AbstractDistributor = require('./abstract-distributor');

class CloudDistributor extends AbstractDistributor {
  /**
   * @param {Object} configObject
   */
  constructor(configObject) {
    super(configObject);

    const firstKey = Object.keys(this.config)[0];
    this._projectRoot = this.config[firstKey].project.root;

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
    const s3directory = config.api.replace('api', 'projects');

    this._dependencyTable = this.buildDependencyTable(this.config, dependencyDirection);

    return Promise.all([this._fetchAccountId(), this._buildFileList()])
      .then(([accountId, files]) => {
        logger.warn('Uploading project to S3.');

        const s3Prefix = [s3directory, accountId, this.THUB_RUN_ID].join('/');
        const pathMap = files.map(it => ({
          localPath: join(this._projectRoot, it),
          s3Path: [s3Prefix, it].join('/')
        }));

        return s3Helper.uploadFiles(S3Helper.METADATA_BUCKET, pathMap);
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
              actions: actions,
              thubRunId: this.THUB_RUN_ID,
              config: config
            });

            inProgress++;

            logger.warn(`[${config.name}] Deploy started!`);
            fetch.post('thub/deploy/create', { body })
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
   * @description Returns the current execution file mapping
   * @return {String[]}
   * @private
   */
  _getExecutionMapping() {
    const componentMappings = [].concat(...Object.keys(this.config).map(hash => this.config[hash].mapping));

    return [...new Set(componentMappings)];
  }

  /**
   * @description Returns an array of files' paths required for the current execution
   * @return {Promise<String[]>}
   * @private
   */
  _buildFileList() {
    const mapping = this._getExecutionMapping();

    return Promise.all(mapping.map(path => fse.stat(path).then(stats => {
      if (stats.isFile()) {
        return [path];
      }

      if (stats.isDirectory()) {
        return globPromise(join(path, '**'), {
          cwd: this._projectRoot,
          dot: true,
          ignore: ConfigLoader.defaultIgnorePatterns,
          nodir: true
        });
      }

      return [];
    }))).then(results => [].concat(...results));
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
