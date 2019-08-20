'use strict';

const path = require('path');
const cluster = require('cluster');
const ApiHelper = require('../api-helper');
const Distributor = require('./distributor');
const { physicalCpuCount, threadsLimitCount } = require('../util');


class LocalDistributor extends Distributor {
  /**
   * @param {Object} command
   */
  constructor(command) {
    super(command);
    this._worker = path.join(__dirname, 'worker.js');
    this._workersCount = 0;
    this._loggerWorker = path.join(__dirname, 'logger-worker.js');
    this._loggerWorkerCount = 0;
    this._loggerLastLog = {};
    this._threadsCount = this.parameters.usePhysicalCpu ? physicalCpuCount() : threadsLimitCount(this.parameters);

    if (ApiHelper.tokenIsValid) {
      this._createLoggerWorker();
      this._threadsCount--;
    }

    cluster.setupMaster({ exec: this._worker });
  }

  /**
   * @param {String} hash
   * @private
   */
  _createWorker(hash) {
    cluster.setupMaster({ exec: this._worker });
    const cfgThread = this.projectConfig[hash];

    const worker = cluster.fork({
      THUB_RUN_ID: this.runId,
      TERRAFORM_ACTIONS: this.TERRAFORM_ACTIONS,
      THUB_TOKEN_IS_VALID: ApiHelper.tokenIsValid || '',
      ...this._env
    });

    delete this._dependencyTable[hash];

    this._workersCount++;
    worker.send({ workerType: 'default', data: cfgThread, parameters: this.parameters });
  }

  _createLoggerWorker() {
    cluster.setupMaster({ exec: this._loggerWorker });

    this.loggerWorker = cluster.fork({ THUB_RUN_ID: this.runId, ...this._env });

    this._loggerWorkerCount++;

    this.loggerWorker.send({ workerType: 'logger', data: ApiHelper.retrieveDataToSend(), parameters: this.parameters });
  }

  /**
   * @private
   */
  _distributeConfigs() {
    const hashes = Object.keys(this._dependencyTable);

    for (let index = 0; this._workersCount < this._threadsCount && index < hashes.length; index++) {
      const hash = hashes[index];
      const dependsOn = Object.keys(this._dependencyTable[hash]);

      if (!dependsOn.length) {
        this._createWorker(hash);
      }
    }
  }

  /**
   * @param {String[]} actions
   * @param {String} format
   * @param {Boolean} planDestroy
   * @param {Number} dependencyDirection
   * @param {String} resourceName
   * @param {String} importId
   * @param {Boolean} input
   * @return {Promise}
   */
  async runActions(actions, {
    format = '',
    planDestroy = false,
    dependencyDirection = null,
    resourceName = '',
    importId = '',
    input = false
  } = {}) {
    this._env = {
      format, planDestroy, resourceName, importId, input
    };

    const results = [];
    this._dependencyTable = this.buildDependencyTable(dependencyDirection);
    this.TERRAFORM_ACTIONS = actions;

    ApiHelper.on('loggerWork', () => {
      if (!this.loggerWorker || (this.loggerWorker && this.loggerWorker.isDead())) {
        ApiHelper.setIsBusy();
        return this._createLoggerWorker();
      }

      return false;
    });

    return new Promise((resolve, reject) => {
      this._distributeConfigs();

      cluster.on('message', (worker, data) => {
        if (data.isError) {
          this._error = this._handleError(data.error);
          return;
        }

        if (data.isLogger || data.workerLogger) {
          return this._loggerMessageHandler(data);
        }

        if (data.data) {
          results.push(data.data);
        }

        this.removeDependencies(this._dependencyTable, data.hash);
      });

      cluster.on('exit', (worker, code) => {
        if (LocalDistributor._getWorkerName(worker) === 'logger-worker') {
          return;
        }

        this._workersCount--;

        if (code === 0) {
          this._distributeConfigs();
        }

        const hashes = Object.keys(this._dependencyTable);
        const workersId = Object.keys(cluster.workers);
        const defaultWorkersLength = workersId.length - this._loggerWorkerCount;

        if (!defaultWorkersLength && !hashes.length) {
          if (this._error) {
            reject(this._error);
          } else {
            resolve(results);
          }
        }
      });
    });
  }


  /**
   * @param {Object} data
   * @private
   */
  _loggerMessageHandler(data) {
    if (data.isLogger && !this._isPreviousWorker(data)) {
      this._loggerWorkerLastId = data.workerId;
      this._loggerWorkerCount--;

      ApiHelper.setIsFree();
    }

    if (data.workerLogger) {
      switch (data.type) {
        case 'logs':
          if (!ApiHelper.canApiLogsBeSent() || this._isDuplicate(data)) {
            return;
          }

          this._loggerLastLog[data.workerId] = data.messages;

          ApiHelper.sendLogsToApi(data);
          break;
        case 'workflow':
          ApiHelper.sendComponentFlow({ ...data.options, actions: this.TERRAFORM_ACTIONS });
          break;
      }
    }
  }

  /**
   * Kill parallel workers and build an error
   * @param {Error|Object} err
   * @return {Error}
   * @private
   */
  _handleError(err) {
    Object.keys(cluster.workers).forEach(id => {
      const worker = cluster.workers[id];
      worker.kill();
    });

    this._dependencyTable = {};

    return (err.constructor === Error) ? err : new Error(`Worker error: ${err}`);
  }

  /**
   * @param {Object} data
   * @return {Boolean}
   * @private
   */
  _isDuplicate(data) {
    return this._loggerLastLog && this._loggerLastLog[data.workerId] === data.messages;
  }

  /**
   * @param {Object} data
   * @return {Boolean}
   * @private
   */
  _isPreviousWorker(data) {
    return this._loggerWorkerLastId && this._loggerWorkerLastId === data.workerId;
  }

  /**
   * Returns worker spawn file name
   * @param {Object} worker
   * @return {String}
   * @private
   */
  static _getWorkerName(worker) {
    const fileName = worker.process.spawnargs[1];
    const extension = path.extname(fileName);

    return path.basename(fileName, extension);
  }
}

module.exports = LocalDistributor;
