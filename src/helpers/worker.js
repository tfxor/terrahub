'use strict';

const cluster = require('cluster');
const Terrahub = require('../helpers/terrahub');
const { promiseSeries } = require('../helpers/util');

/**
 * Parse terraform actions
 * @returns {Array}
 */
function getActions() {
  return process.env.TERRAFORM_ACTIONS.split(',').filter(Boolean);
}

/**
 * Get task with hooks (if enabled)
 * @param {Object} config
 * @returns {Function}
 */
function getTasks(config) {
  const terrahub = new Terrahub(config);

  return () => {
    return promiseSeries(getActions().map(action => {
      return () => terrahub.getTask(action);
    }));
  };
}

/**
 * Runner
 * @param {Object[]} configs
 */
function run(configs) {
  promiseSeries(configs.map(config => getTasks(config))).then(lastResult => {
    process.send({
      id: cluster.worker.id,
      data: lastResult,
      isError: false
    });
    process.exit(0);
  }).catch(error => {
    process.send({
      id: cluster.worker.id,
      error: error.message || error,
      isError: true
    });
    process.exit(1);
  });
}

/**
 * Message listener
 */
process.on('message', config => {
  let queue = [];

  /**
   * @param {Object} cfg
   */
  function handle(cfg) {
    queue.push(cfg);
    cfg.children.forEach(child => handle(child));
    cfg.children = [];
  }

  handle(config);
  run(queue);
});
