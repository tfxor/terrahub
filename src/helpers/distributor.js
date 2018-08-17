'use strict';

const os = require('os');
const path = require('path');
const cluster = require('cluster');
const logger = require('./logger');
const { uuid } = require("./util");

class Distributor {
  /**
   * @param {Object[]} config
   * @param {String[]} actions
   * @param {Object} options
   */
  constructor(config, actions, options = {}) {
    const {
      worker = 'worker.js',
      env = {},
      isOrderDependent = true
    } = options;

    this._isOrderDependent = isOrderDependent;
    this._env = Object.assign({
      TERRAFORM_ACTIONS: actions,
      THUB_RUN_ID: uuid()
    }, env);

    this._config = [].concat(config);
    this._worker = path.join(__dirname, worker);
    this._workersCount = 0;
    this._output = [];
    this._threadsCount = os.cpus().length;

    cluster.setupMaster({ exec: this._worker });
  }


  /**
   * @param {Object} cfg
   * @private
   */
  _createWorker(cfg) {
    const worker = cluster.fork(this._env);

    this._workersCount++;
    worker.send(cfg);
  }

  /**
   * @private
   */
  _distributeConfigs() {
    while (this._workersCount < this._threadsCount && this._config.length) {
      const cfg = this._config[0];
      const dependsOn = Object.keys(cfg.dependsOn);

      if (!this._isOrderDependent || dependsOn.every(it =>
        !this._config.some(cfg => cfg.hash === it)
      )) {
        this._createWorker(this._config.shift());
      }
    }
  }

  /**
   * @returns {Promise}
   */
  run() {
    return new Promise((resolve, reject) => {
      this._distributeConfigs();

      cluster.on('message', (worker, data) => {
        if (data.isError) {
          return this._error = this._handleError(data.error);
        }

        if (data.data) {
          this._output.push(data.data);
        }
      });

      cluster.on('exit', (worker, code, signal) => {
        this._workersCount--;

        if (!signal) {
          this._distributeConfigs();
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
      outputs.forEach(it => logger.raw(`[${it.component}] ${(new Buffer(it.stdout)).toString()}`));

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
      cluster.workers[id].kill();
    });

    return (err.constructor === Error) ? err : new Error(`Worker error: ${JSON.stringify(err)}`);
  }
}

module.exports = Distributor;
