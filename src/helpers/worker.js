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
 * @param {Object[]} configs
 * @return {Function[]}
 */
function getTasks(configs) {
  const terrahubList = configs.map(config => new Terrahub(config));

  return getActions().map(action =>
    action !== 'build' ? getTerraformTask(terrahubList, action) : getBuildTask(configs)
  );
}

/**
 * @param {Terrahub[]} terrahubList
 * @param {String} action
 * @return {Function}
 */
function getTerraformTask(terrahubList, action) {
  return () => {
    const output = [];

    return promiseSeries(terrahubList.map(terrahub =>
      () => terrahub.getTask(action).then(result => {
        if (result) {
          output.push(result);
        }

        return result;
      })
    )).then(() => Promise.resolve(output));
  }
}

/**
 * @param {Object[]} configs
 * @return {Function}
 */
function getBuildTask(configs) {
  return () =>
    promiseSeries(configs.map(config => BuildHelper.getComponentBuildTask(config)));
}

/**
 * Runner
 * @param {Object[]} configs
 */
function run(configs) {
  promiseSeries(getTasks(configs)).then(lastResult => {
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
