'use strict';

const os = require('os');
const path = require('path');
const cluster = require('cluster');
const { config } = require('../../parameters');
const { physicalCpuCount } = require('../util');
const AbstractDistributor = require('./abstract-distributor');
const ApiHelper = require('../api-helper');

class ThreadDistributor extends AbstractDistributor {
  /**
   * @param {Object} configObject
   * @param {String} thubRunId
   */
  constructor(configObject, thubRunId) {
    super(configObject, thubRunId);

    this._worker = path.join(__dirname, 'worker.js');
    this._loggerWorker = path.join(__dirname, 'logger-worker.js');
    this._workersCount = 0;
    this._loggerWorkerCounter = 0;
    this._threadsCount = config.usePhysicalCpu ? physicalCpuCount() : os.cpus().length;

    // if (!process.env.THUB_LOGGER_WORKER) {
    //   this._createLoggerWorker();
    // }

  }

  /**
   * @param {String} hash
   * @private
   */
  _createWorker(hash) {
    cluster.setupMaster({ exec: this._worker });

    const cfgThread = this.config[hash];

    const worker = cluster.fork(Object.assign({
      THUB_RUN_ID: this.THUB_RUN_ID,
      TERRAFORM_ACTIONS: this.TERRAFORM_ACTIONS
    }, this._env));

    delete this._dependencyTable[hash];

    this._workersCount++;
    worker.send({ workerType: 'default', data: cfgThread});
  }

  _createLoggerWorker(actions) {
    cluster.setupMaster({ exec: this._loggerWorker });

    const loggerWorker = cluster.fork({
      THUB_RUN_ID: this.THUB_RUN_ID,
    });

    this._workersCount ++;
    this._loggerWorkerCounter++;

    loggerWorker.send({ workerType: 'logger', data: { config: this.config, actions } });
    process.env.THUB_LOGGER_WORKER = 1;
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
        //ApiHelper startComponentExecution

        this._sendInfoToApi({ hash });
      }
    }
  }

  _sendInfoToApi({ hash, action }) {
    ApiHelper.sendComponentFlow({
      status: 'start' ,
      actions: this.TERRAFORM_ACTIONS,
      config: this.config,
      componentHash: hash
    }
    );
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
  runActions(actions, {
    format = '',
    planDestroy = false,
    dependencyDirection = null,
    resourceName = '',
    importId = '',
    input = false
  } = {}) {
    this._env = { format, planDestroy, resourceName, importId, input };

    const results = [];
    this._dependencyTable = this.buildDependencyTable(this.config, dependencyDirection);

    // console.log({ TABLE: this._dependencyTable});

    this.TERRAFORM_ACTIONS = actions;
    // Only Sync !! add dictionary


    // this._createLoggerWorker(actions);

    return new Promise((resolve, reject) => {
      this._distributeConfigs();

      cluster.on('message', (worker, data) => {
        if (data.isError) {
          this._error = this._handleError(data.error);
          return;
        }

        if (data.data) {
          //ApiHelper stopComponentExecution
          console.log( { data : data } );
          this._sendInfoToApi({ status: 'stop', hash: data.hash, action: data.data.action });
          results.push(data.data);
        }

        this.removeDependencies(this._dependencyTable, data.hash);
      });

      cluster.on('exit', (worker, code) => {
        this._workersCount--;

        if (code === 0) {
          this._getWorkerType(worker) !== 'logger-worker' ? this._distributeConfigs() : this._createLoggerWorker();
        }

        const hashes = Object.keys(this._dependencyTable);
        const workersId = Object.keys(cluster.workers);

        if (!workersId.length && !hashes.length) {
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

    return (err.constructor === Error) ? err : new Error(`Worker error: ${JSON.stringify(err)}`);
  }

  /**
   * Returns file name from which was created worker
   * @param {Object} worker
   * @return {string}
   * @private
   */
  _getWorkerType(worker) {
    const fileName = worker.process.spawnargs[1];
    const extension = path.extname(fileName);

    return path.basename(fileName,extension);
  }
}

module.exports = ThreadDistributor;
