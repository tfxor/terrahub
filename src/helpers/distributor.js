'use strict';

const os = require('os');
const path = require('path');
const cluster = require('cluster');
const logger = require('./logger');

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
    this._output = [];

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
        if (data.isError) {
          return this._error = this._handleError(data.error);
        }

        if (data.data) {
          data.data.forEach(it => this._output.push(it));
        }
      });

      cluster.on('exit', () => {
        this._workersCount--;

        if (hashes.length > 0) {
          this._createWorker(hashes.shift());
        }

        if (this._workersCount === 0) {
          if (this._error) {
            reject(this._error);
          } else {
            this._handleOutput().then(result => {
              resolve(result);
            });
          }
        }
      });
    });
  }

  /**
   * Prints the output data for the 'output' command
   * @return {Promise}
   * @private
   */
  _handleOutput() {
    const outputs = this._output.filter(it => it.action === 'output');

    if (!outputs.length) {
      return Promise.resolve('Done');
    }

    if (outputs[0].env.format === 'json') {
      let result = {};

      outputs.forEach(it => result[it.component] = JSON.parse((new Buffer(it.stdout)).toString()));

      logger.log(JSON.stringify(result));

      return Promise.resolve();
    } else {
      outputs.forEach(it => logger.raw(`[${it.component}] ${(new Buffer(it.stdout)).toString()}`))

      return Promise.resolve('Done');
    }
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
