'use strict';

const cluster = require('cluster');
const logger = require('../logger');
const HclHelper = require('../hcl-helper');
const { promiseSeries } = require('../util');
const BuildHelper = require('../build-helper');
const Terrahub = require('../wrappers/terrahub');

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
 * @param {Object} parameters
 * @return {Function[]}
 */
function getTasks(config, parameters) {
  const terrahub = new Terrahub(config, process.env.THUB_RUN_ID, parameters);
  const { distributor } = config;

  return getActions().map(action => options => {
    logger.updateContext({ action: action });

    return action !== 'build'
      ? terrahub.getTask(action, options)
      : BuildHelper.getComponentBuildTask(config, distributor);
  });
}

/**
 * BladeRunner
 * @param {Object} config
 * @param {Object} parameters
 */
function run(config, parameters) {
  logger.updateContext({
    runId: process.env.THUB_RUN_ID,
    componentName: config.name,
  });

  HclHelper.middleware(config, parameters)
    .then(cfg => promiseSeries(getTasks(cfg, parameters),
      (prev, fn) => prev.then(data => fn(data ? { skip: !!data.skip } : {}))))
    .then(lastResult => {
      if (lastResult.action !== 'output') {
        delete lastResult.buffer;
      }

      process.send({
        id: cluster.worker.id,
        data: Buffer.isBuffer(lastResult) ? lastResult.toString() : lastResult,
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
process.on('message', msg => (msg.workerType === 'default' ? run(msg.data, msg.parameters) : null));
