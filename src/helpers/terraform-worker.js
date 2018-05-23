'use strict';

const path = require('path');
const cluster = require('cluster');
const Terraform = require('../helpers/terraform');
const { promiseSeries } = require('../helpers/util');

/**
 * Parse terraform actions
 * @returns {Array}
 */
function getActions() {
  return process.env.TERRAFORM_ACTIONS.split(',').filter(Boolean);
}

/**
 * Require hook module
 * @param {Object} config
 * @param {String} action
 * @param {String} hook
 * @returns {Function}
 */
function requireHook(config, action, hook) {
  try {
    return require(path.join(config.app, config.hooks[action][hook]));
  } catch (err) {
    return () => Promise.resolve();
  }
}

/**
 * @param {Object} config
 * @param {String} action
 * @returns {Promise|PromiseLike}
 */
function getTask(config, action) {
  const terraform = new Terraform(config);
  const afterHook = requireHook(config, action, 'after');
  const beforeHook = requireHook(config, action, 'before');

  return beforeHook(config)
    .then(() => terraform[action]())
    .then(res => afterHook(config, res));
}

/**
 * Get task with hooks (if enabled)
 * @param {Object} config
 * @returns {Function}
 */
function getTasks(config) {
  return () => {
    return promiseSeries(getActions().map(action => {
      return () => getTask(config, action);
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
    // @todo remove it after stable release
    console.error('terraform-worker:', error);

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

  function handle(cfg) {
    queue.push(cfg);
    cfg.children.forEach(child => handle(child));
    cfg.children = [];
  }

  handle(config);
  run(queue);
});
