'use strict';

const TerraformCommand = require('../terraform-command');
const os = require('os');
const path = require('path');
const cluster = require('cluster');
const logger = require('./logger');
const { uuid, physicalCpuCount } = require('./util');
const { config } = require('../parameters');

class Distributor {
  /**
   * @param {Object} config
   */
  constructor(cfg) {
    this.THUB_RUN_ID = uuid();
    this._config = Object.assign({}, cfg);
    this._worker = path.join(__dirname, 'worker.js');
    this._workersCount = 0;
    this._threadsCount = config.useLogicalCpu ? physicalCpuCount() : os.cpus().length;
    cluster.setupMaster({ exec: this._worker });
  }

  /**
   * @param {Object} config
   * @param {Number} direction
   * @return {Object}
   * @private
   */
  _buildDependencyTable(config, direction) {
    const result = {};
    const keys = Object.keys(config);

    keys.forEach(key => {
      result[key] = {};
    });

    switch (direction) {
      case TerraformCommand.FORWARD:
        keys.forEach(key => {
          Object.assign(result[key], config[key].dependsOn);
        });
        break;

      case TerraformCommand.REVERSE:
        keys.forEach(key => {
          Object.keys(config[key].dependsOn).forEach(hash => {
            result[hash][key] = null;
          });
        });
        break;
    }

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

      if (!dependsOn.length) {
        this._createWorker(hash);
      }
    }
  }

  /**
   * @param {String[]} actions
   * @param {Object} options
   * @return {Promise}
   */
  runActions(actions, options) {
    const {
      silent = false,
      format = 'text',
      planDestroy = false,
      dependencyDirection = null
    } = options;

    this._env = {
      silent: silent,
      format: format,
      planDestroy: planDestroy
    };

    this._output = [];
    this._dependencyTable = this._buildDependencyTable(this._config, dependencyDirection);
    this.TERRAFORM_ACTIONS = actions;

    return new Promise((resolve, reject) => {
      this._distributeConfigs();

      cluster.on('message', (worker, data) => {
        if (data.isError) {
          this._error = this._handleError(data.error);
          return;
        }

        if (data.data) {
          this._output.push(data.data);
        }

        this._removeDependencies(data.hash);
      });

      cluster.on('exit', (worker, code) => {
        this._workersCount--;

        if (code === 0) {
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
   * @return {*}
   * @private
   */
  _handleOutput() {
    const outputs = this._output.filter(it => it.action === 'output');

    if (!outputs.length) {
      return Promise.resolve('Done');
    }

    if (outputs[0].env.format === 'json') {
      const result = {};

      outputs.forEach(it => {
        let stdout = (new Buffer(it.stdout)).toString();
        if (stdout[0] !== '{') {
          stdout = stdout.slice(stdout.indexOf('{'));
        }
        result[it.component] = JSON.parse(stdout);
      });

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
}

module.exports = Distributor;
