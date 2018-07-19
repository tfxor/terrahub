'use strict';

const Terrahub = require('../helpers/terrahub');
const { promiseSeries } = require('../helpers/util');
const { setMessageListener } = require('./worker-help');

/**
 * Parse terraform actions
 * @returns {Array}
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
    () => promiseSeries(terrahubList.map(terrahub =>
      () => terrahub.getTask(action)
    ))
  );
}

setMessageListener(getTasks);
