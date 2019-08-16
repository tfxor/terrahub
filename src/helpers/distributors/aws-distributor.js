'use strict';

const fse = require('fs-extra');
const { join } = require('path');
const Util = require('../util');
const S3Helper = require('../s3-helper');
const { globPromise } = require('../util');
const ApiHelper = require('../api-helper');
const Distributor = require('./distributor');
const { defaultIgnorePatterns } = require('../../config-loader');

class AwsDistributor extends Distributor {

  /**
   * @param {Object} command
   */
  constructor(command) {
    super(command);
    this.parameters.isCloud = true;
    this.config = this.parameters.config;
    this.fetch = this.parameters.fetch;

    this._errors = [];
  }

  /**
   * @param {String[]} actions
   * @param {Number} dependencyDirection
   * @return {Promise}
   * @override
   */
  async runActions(actions, { dependencyDirection = null } = {}) {
    await this._validateRequirements();

    let inProgress = 0;

    const s3Helper = new S3Helper();
    const s3directory = this.config.api.replace('api', 'projects');

    this._dependencyTable = this.buildDependencyTable(dependencyDirection);

    return Promise.all([this._fetchAccountId(), this._buildFileList()])
      .then(([accountId, files]) => {
        this.logger.warn('Uploading project to S3.');

        const s3Prefix = [s3directory, accountId, this.runId].join('/');
        const pathMap = files.map(it => ({
          localPath: join(this._projectRoot, it),
          s3Path: [s3Prefix, it].join('/')
        }));

        return s3Helper.uploadFiles(S3Helper.METADATA_BUCKET, pathMap);
      })
      .then(() => {
        this.logger.warn('Directory uploaded to S3.');

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
            const config = this.projectConfig[hash];

            this.parameters.jitPath = this.parameters.jitPath.replace('/cache', Util.lambdaHomedir);

            const body = JSON.stringify({
              actions: actions,
              thubRunId: this.runId,
              config: config,
              parameters: this.parameters
            });

            inProgress++;

            this.logger.warn(`[${config.name}] Deploy started!`);
            this.fetch.post('thub/deploy/create', { body })
              .then(() => {
                this.removeDependencies(this._dependencyTable, hash);

                this.logger.info(`[${config.name}] Successfully deployed!`);
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


  async _validateRequirements() {
    if (!this.config.logs) {
      throw new Error('Please enable logging in `.terrahub.json`.');
    }

    const errors = Object.keys(this.projectConfig).filter(hash => {
      const { cloudAccount, backendAccount } = this.projectConfig[hash].terraform;

      return !cloudAccount && !backendAccount;
    });

    if (errors.length) {
      const errorMessage = `'${errors.map(it => this.projectConfig[it].name).join('\' ,\'')}' do not have` +
        ` CloudAccount and/or BackendAccount in config.`;

      throw new Error(errorMessage);
    }

    const cloudAccounts = await ApiHelper.retrieveCloudAccounts();
    const accountErrors = Object.keys(this.projectConfig).filter(hash => {
      const { cloudAccount } = this.projectConfig[hash].terraform;

      return !cloudAccounts.aws.some(it => it.name === cloudAccount);
    });

    if (accountErrors.length) {
      const errorMessage = `'${accountErrors.map(it => this.projectConfig[it].name).join('\', \'')}' do not have` +
        ` valid account in config.`;

      throw new Error(errorMessage);
    }
  }

  /**
   * @description Returns the current execution file mapping
   * @return {String[]}
   * @private
   */
  _getExecutionMapping() {
    const componentMappings = [].concat(...Object.keys(this.projectConfig).map(hash => this.projectConfig[hash].mapping));

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
          ignore: defaultIgnorePatterns,
          nodir: true
        });
      }

      return [];
    }))).then(results => [].concat(...results));
  }

  /**
   * @return {Promise<String>}
   */
  _fetchAccountId() {
    return this.fetch.get('thub/account/retrieve').then(json => Promise.resolve(json.data.id));
  }
}

module.exports = AwsDistributor;
