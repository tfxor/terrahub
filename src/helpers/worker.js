'use strict';

const cluster = require('cluster');
const Terrahub = require('../helpers/terrahub');
const BuildHelper = require('./build-helper');
const { promiseSeries } = require('../helpers/util');

/**
 * Parse terraform actions
 * @return {Array}
 */
function getActions() {
  return process.env.TERRAFORM_ACTIONS.split(',').filter(Boolean);
}

/**
 * Get task with hooks (if enabled)
 * @param {Object} config
 * @return {Function[]}
 */
function getTasks(config) {
  const terrahub = new Terrahub(config);

  return getActions().map(action =>
    (options) => (action !== 'build' ?
      terrahub.getTask(action, options) : BuildHelper.getComponentBuildTask(config))
  );
}

/**
 * BladeRunner
 * @param {Object} config
 */
function run(config) {
  promiseSeries(getTasks(config), (prev, fn) => prev.then(data => fn(data ? { skip: !!data.skip } : {})))
    .then(lastResult => {
      if (lastResult.action !== 'output') {
        delete lastResult.buffer;
      }

      process.send({
        id: cluster.worker.id,
        data: lastResult,
        isError: false,
        hash: config.hash
      });
      process.exit(0);
    })
    .catch(error => {
      process.send({
        id: cluster.worker.id,
        error: error.message || error,
        isError: true,
        hash: config.hash
      });
      process.exit(1);
    });
}

/**
 * Message listener
 */
process.on('message', run);
