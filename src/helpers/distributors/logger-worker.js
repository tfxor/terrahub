'use strict';

const cluster = require('cluster');
const ApiHelper = require('../api-helper');


function run(promises, parameters) {
  ApiHelper.init(parameters);
  const _promises =  promises.map(ApiHelper.asyncFetch);

  return Promise.all(_promises).then(() => {
    process.send({
      isLogger: true,
      isError: false,
      workerId: cluster.worker.id
    });

    process.exit(0);

  }).catch(error => {
    process.send({
      isLogger: true,
      isError: true,
      error: error.message || error,
      workerId: cluster.worker.id
    });

    process.exit(1);
  });
}

/**
 * Message listener
 */
process.on('message', msg => msg.workerType === 'logger' ? run(msg.data, msg.parameters) : null);
