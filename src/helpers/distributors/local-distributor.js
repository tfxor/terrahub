'use strict';

const path = require('path');
const cluster = require('cluster');
const ApiHelper = require('../api-helper');
const { physicalCpuCount, threadsLimitCount } = require('../util');


class LocalDistributor {

  constructor() {
    this._worker = path.join(__dirname, 'worker.js');
    this._loggerWorker = path.join(__dirname, 'logger-worker.js');
    this._loggerWorkerCount = 0;
    this._workersCount = 0;
    this._loggerLastLog = {};

    cluster.setupMaster({ exec: this._worker });
  }

  /**
   * @param {Object} parameters
   * @param {Object} config
   * @param {Object} env
   * @param {Event} emitter
   * @return {LocalDistributor}
   */
  init(parameters, config, env, emitter) {
    this.emitter = emitter;
    this._env = env;
    this.parameters = parameters;
    this.config = config;
    this._threadsCount = this.parameters.usePhysicalCpu ? physicalCpuCount() : threadsLimitCount(this.parameters);

    return this;
  }

  /**
   * @param {String[]} actions
   * @param {String} runId
   * @private
   */
  _createWorker(actions, runId) {
    cluster.setupMaster({ exec: this._worker });
    const cfgThread = this.config;

    this.TERRAFORM_ACTIONS = actions;

    const worker = cluster.fork({
      THUB_RUN_ID: runId,
      TERRAFORM_ACTIONS: actions,
      THUB_TOKEN_IS_VALID: ApiHelper.tokenIsValid || '',
      ...this._env
    });

    this._workersCount++;
    worker.send({ workerType: 'default', data: cfgThread, parameters: this.parameters });


    ApiHelper.on('loggerWork', () => {
      console.log('LOGGER EVENT ');

      if (!this.loggerWorker || (this.loggerWorker && this.loggerWorker.isDead())) {
        ApiHelper.setIsBusy();
        return this._createLoggerWorker();
      }

      return false;
    });

    cluster.on('message', (worker, data) => {
      if (data.isError) {
        this._error = this._handleError(data.error);

        setImmediate(() => this.emitter.emit('exit', { isError: true, message: this._error }));
      }

      if (data.isLogger || data.workerLogger) {
        return this._loggerMessageHandler(data);
      }

      if (data.data) {
        setImmediate(() => this.emitter.emit('message', { worker: worker.id, data: data }));
      }
    });

    cluster.on('exit', (worker, code) => {
      if (LocalDistributor._getWorkerName(worker) === 'logger-worker') {
        return;
      }

      this._workersCount--;

      setImmediate(() => this.emitter.emit('exit', { worker, code, hash: this.config.hash }));
    });
  }

  /**
   * @private
   */
  _createLoggerWorker() {
    cluster.setupMaster({ exec: this._loggerWorker });

    this.loggerWorker = cluster.fork();

    this._loggerWorkerCount++;

    this.loggerWorker.send({ workerType: 'logger', data: ApiHelper.retrieveDataToSend(), parameters: this.parameters });
  }

  /**
   * @param {String[]} actions
   * @param {String} runId
   */
  distribute({ actions, runId } = {}) {
    if (this._workersCount < this._threadsCount) {
      this._createWorker(actions, runId);
    }

    if (ApiHelper.tokenIsValid) {
      this._createLoggerWorker();
      this._threadsCount--;
    }
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

    return (err.constructor === Error) ? err : new Error(`Worker error: ${err.message || err}`);
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
   */
  static _getWorkerName(worker) {
    const fileName = worker.process.spawnargs[1];
    const extension = path.extname(fileName);

    return path.basename(fileName, extension);
  }
}

module.exports = new LocalDistributor();
