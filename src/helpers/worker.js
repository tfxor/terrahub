'use strict';

const cluster = require('cluster');
const Terrahub = require('../helpers/terrahub');
const { promiseSeries } = require('../helpers/util');
const BuildHelper = require('./build-helper');

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
    () => (action !== 'build' ?
       terrahub.getTask(action) :
       BuildHelper.getComponentBuildTask(config))
  );
}

/**
 * BladeRunner
 * @param {Object} config
 */
function run(config) {
  promiseSeries(getTasks(config)).then(lastResult => {
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
process.on('message', run);
