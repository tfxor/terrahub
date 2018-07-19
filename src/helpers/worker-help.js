'use strict';

const { promiseSeries } = require('./util');
const cluster = require('cluster');

/**
 * Runner
 * @param {Object[]} queue
 * @param {Function} getTasks
 */
function run(queue, getTasks) {
  promiseSeries(getTasks(queue)).then(lastResult => {
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
 * @description Set a worker message listener
 * @param {Function} getTasks
 */
function setMessageListener(getTasks) {
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
    run(queue, getTasks);
  });
}

module.exports = {
  setMessageListener
};
