'use strict';

const os = require('os');
const path = require('path');
const cluster = require('cluster');

class Distributor {
  /**
   * @param {Object} config
   * @param {String} worker
   * @param {Object} env
   */
  constructor(config, { worker = 'terraform-worker.js', env = {} }) {
    this._env = env;
    this._config = config;
    this._worker = path.join(__dirname, worker);
    this._workersCount = 0;

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
    let worker = cluster.fork(this._env);

    this._workersCount++;
    worker.send(threadCfg);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const hashes = Object.keys(this._config);
    let threads = this._getThreadsCount();

    return new Promise((resolve, reject) => {
      for (let i = 0; i < threads; i++) {
        this._createWorker(hashes.shift());
      }

      cluster.on('message', (worker, data) => {
        this._workersCount--;

        if (data.isError) {
          this._error = this._handleError(data.error);
        }

        if (this._workersCount === 0) {
          if (this._error) {
            return reject(this._error);
          } else {
            return resolve('Done');
          }
        }

        if (hashes.length > 0) {
          this._createWorker(hashes.shift());
        }
      });

      cluster.on('error', err => {
        this._workersCount--;

        this._error = this._handleError(err);

        if (this._workersCount === 0) {
          reject(this._error);
        }
      });

      cluster.on('exit', () => {
        this._workersCount--;

        if (this._workersCount === 0) {
          reject(this._error);
        }
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

    return (err.constructor === Error) ? err : new Error(`Worker error: ${JSON.stringify(err)}`);
  }
}

module.exports = Distributor;
