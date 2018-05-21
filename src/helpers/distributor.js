'use strict';

const os = require('os');
const path = require('path');
const cluster = require('cluster');

class Distributor {
  /**
   * @param {Array} actions
   * @param {Object} config
   */
  constructor(actions, config) {
    this._config = config;
    this._actions = actions;
    this._worker = path.join(__dirname, '../helpers/terraform-worker.js');
    this._workerIds = [];

    cluster.setupMaster({ exec: this._worker });
  }

  /**
   * @returns {Number}
   * @private
   */
  _getThreadsCount() {
    const coresCount = os.cpus().length;
    const independent = Object.keys(this._config).length;

    return (coresCount <= independent) ? coresCount : independent;
  }

  /**
   * @param {String} hash
   * @private
   */
  _createWorker(hash) {
    let threadCfg = this._config[hash];
    let worker = cluster.fork({ TERRAFORM_ACTIONS: this._actions });

    worker.send(threadCfg);
    this._workerIds.push(worker.id);
  }

  /**
   * @returns {Promise}
   */
  run() {
    let hashes = Object.keys(this._config);
    let threads = this._getThreadsCount();
    let workerIds = [];

    return new Promise((resolve, reject) => {
      for (let i = 0; i < threads; i++) {
        this._createWorker(hashes.shift());
      }

      cluster.on('message', (worker, data) => {
        if (this._workerIds.includes(worker.id)) {
          this._workerIds.splice(workerIds.indexOf(worker.id), 1);
        }

        if (data.isError) {
          return reject(this._handleError(data.error));
        }

        if (this._workerIds.length === 0) {
          return resolve('Done');
        }

        if (hashes.length > 0) {
          this._createWorker(hashes.shift());
        }
      });

      cluster.on('error', err => {
        return reject(this._handleError(err));
      });
    });
  }

  /**
   * Kill parallel workers and build an error
   * @param {Error|Object} err
   * @returns {Error}
   * @private
   */
  _handleError(err) {
    Object.keys(cluster.workers).forEach(id => {
      let worker = cluster.workers[id];
      worker.kill();
    });

    return (err.constructor === 'Error')
      ? err
      : new Error(`Worker error: ${JSON.stringify(err)}`);
  }
}

module.exports = Distributor;
