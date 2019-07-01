'use strict';

const cluster = require('cluster');
const { fetch } = require('../../parameters');


function run(promises) {

  const _promises =  promises.map(({ url, body }) => {
    return fetch.post(url, {
      body: JSON.stringify(body)
    }).catch(err => console.log(err));
  });

  return Promise.all(_promises).then(res => {
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
process.on('message', msg => msg.workerType === 'logger' ? run(msg.data) : null);
