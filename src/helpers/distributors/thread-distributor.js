'use strict';

const os = require('os');
const path = require('path');
const cluster = require('cluster');
const { config } = require('../../parameters');
const { physicalCpuCount } = require('../util');
const AbstractDistributor = require('./abstract-distributor');

class ThreadDistributor extends AbstractDistributor {
  /**
   * @param {Object} configObject
   */
  constructor(configObject) {
    super(configObject);

    this._worker = path.join(__dirname, 'worker.js');
    this._workersCount = 0;
    this._threadsCount = config.usePhysicalCpu ? physicalCpuCount() : os.cpus().length;

    cluster.setupMaster({ exec: this._worker });
  }

  /**
   * @param {String} hash
   * @private
   */
  _createWorker(hash) {
    console.log('************** CREATING WORKER **************');
    const cfgThread = this.config[hash];

    const worker = cluster.fork(Object.assign({
      THUB_RUN_ID: this.THUB_RUN_ID,
      TERRAFORM_ACTIONS: this.TERRAFORM_ACTIONS
    }, this._env));

    delete this._dependencyTable[hash];

    this._workersCount++;
    worker.send(cfgThread);
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
        console.log('creating work ', hash);
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
    this.TERRAFORM_ACTIONS = actions;

    return new Promise((resolve, reject) => {
      this._distributeConfigs();
      cluster.on('message', (worker, data) => {
        if (data.isError) {
          this._error = this._handleError(data.error);
          return;
        }

        if (data.data) {
          results.push(data.data);
        }

        this.removeDependencies(this._dependencyTable, data.hash);
      });

      cluster.on('exit', (worker, code, signal) => {
        this._workersCount--;

        if (signal === 'SIGINT') {
          while(!Object.keys(cluster.workers).length) {
            return reject('Gracefully shutting down');
          }
        }

        if (code === 0) {
          this._distributeConfigs();
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
    this._killParallelWorkers();

    return (err.constructor === Error) ? err : new Error(`Worker error: ${JSON.stringify(err)}`);
  }

  _killParallelWorkers() {
    Object.keys(cluster.workers).forEach(id => {
      const worker = cluster.workers[id];

      setTimeout(() => {
        console.log(`Killing worker with id ${worker.id}`);
        worker.kill();
      }, 2000);
    });

    this._dependencyTable = {};
  }

  /**
   * @return {void}
   */
  disconnect() {
    this._killParallelWorkers();
  }

  // checkIfNoWorkersAndExit() {
  //   if (!this._workersCount) {
  //     console.log('Cluster graceful shutdown: done.');
  //     if (shutdownTimer) clearTimeout(shutdownTimer);
  //     process.exit(0);
  //   } else {
  //     console.log('Cluster graceful shutdown: wait ' + this._workersCount + ' worker' + (this._workersCount > 1 ? 's' : '') + '.');
  //   }
  // }


}

module.exports = ThreadDistributor;
