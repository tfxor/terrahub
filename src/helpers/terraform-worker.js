'use strict';

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
 * @param {Object} config
 * @returns {*}
 */
function getTask(config) {
  const terraform = new Terraform(config);

  return () => {
    return promiseSeries(getActions().map(action => terraform[action].bind(terraform)));
  };
}

/**
 * Runner
 * @param {Object[]} configs
 */
function run(configs) {
  promiseSeries(configs.map(config => getTask(config))).then(results => {
    process.send({
      id: cluster.worker.id,
      data: results,
      isError: false
    });
    process.exit(0);
  }).catch(error => {
    // @todo remove it
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
