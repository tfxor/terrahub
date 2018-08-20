'use strict';

const os = require('os');
const path = require('path');
const cluster = require('cluster');
const logger = require('./logger');
const { uuid } = require('./util');

class Distributor {
  /**
   * @param {Object} config
   * @param {Object} options
   */
  constructor(config, options = {}) {
    const {
      worker = 'worker.js',
      silent = false,
      format = 'text'
    } = options;

    this._env = {
      silent: silent,
      format: format
    };

    this.THUB_RUN_ID = uuid();
    this._config = Object.assign({}, config);
    this._worker = path.join(__dirname, worker);
    this._workersCount = 0;
    this._threadsCount = os.cpus().length;

    cluster.setupMaster({ exec: this._worker });
  }

  /**
   * @param {Object} config
   * @return {Object}
   * @private
   */
  _buildDependencyTable(config) {
    const result = {};

    Object.keys(config).forEach(key => {
      result[key] = Object.assign({}, config[key].dependsOn);
    });

    return result;
  }


  /**
   * @param {String} hash
   * @private
   */
  _createWorker(hash) {
    const cfgThread = this._config[hash];

    const worker = cluster.fork(Object.assign({
      THUB_RUN_ID: this.THUB_RUN_ID,
      TERRAFORM_ACTIONS: this.TERRAFORM_ACTIONS
    }, this._env));

    delete this._dependencyTable[hash];

    this._workersCount++;
    worker.send(cfgThread);
  }

  /**
   * Remove dependencies on this component
   * @param {String} hash
   * @private
   */
  _removeDependencies(hash) {
    Object.keys(this._dependencyTable).forEach(key => {
      delete this._dependencyTable[key][hash];
    });
  }

  /**
   * @private
   */
  _distributeConfigs() {
    const hashes = Object.keys(this._dependencyTable);

    for (let index = 0; this._workersCount < this._threadsCount && index < hashes.length; index++) {
      const hash = hashes[index];
      const dependsOn = Object.keys(this._dependencyTable[hash]);

      if (!this._isOrderDependent || !dependsOn.length) {
        this._createWorker(hash);
      }
    }
  }

  /**
   * @param {String[]} actions
   * @param {Boolean} isOrderDependent
   * @returns {Promise}
   */
  runActions(actions, isOrderDependent = true) {
    this._output = [];
    this._dependencyTable = this._buildDependencyTable(this._config);
    this._isOrderDependent = isOrderDependent;
    this.TERRAFORM_ACTIONS = actions;

    return new Promise((resolve, reject) => {
      this._distributeConfigs();

      cluster.on('message', (worker, data) => {
        if (data.isError) {
          return this._error = this._handleError(data.error);
        }

        if (data.data) {
          this._output.push(data.data);
        }

        this._removeDependencies(data.hash);
      });

      cluster.on('exit', (worker, code, signal) => {
        this._workersCount--;

        if (!signal && code === 0) {
          this._distributeConfigs();
        }

        const hashes = Object.keys(this._dependencyTable);
        const workersId = Object.keys(cluster.workers);

        if (!workersId.length && !hashes.length) {
          if (this._error) {
            reject(this._error);
          } else {
            this._handleOutput().then(message => {
              resolve(message);
            });
          }
        }
      });
    });
  }

  /**
   * Prints the output data for the 'output' command
   * @private
   */
  _handleOutput() {
    const outputs = this._output.filter(it => it.action === 'output');

    if (!outputs.length) {
      return Promise.resolve('Done');
    }

    if (outputs[0].env.format === 'json') {
      const result = {};

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
      const worker = cluster.workers[id];
      worker.kill();
    });

    return (err.constructor === Error) ? err : new Error(`Worker error: ${JSON.stringify(err)}`);
  }
}

module.exports = Distributor;
