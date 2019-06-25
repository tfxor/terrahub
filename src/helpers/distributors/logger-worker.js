'use strict';

const cluster = require('cluster');
const ApiHelper = require('../api-helper');

function run(config) {

  console.log('apiHelper :', ApiHelper.retrievePromises());
  console.log('LoggerWorker Count :', process.env.LOGGER_COUNT);
  console.log('LoggerWorker ApiHelper.requestsRetrieve :', JSON.parse(process.env.API_REQUESTS));

  setTimeout(() => {
        process.send({
          id: cluster.worker.id,
          isError: false
        });
        process.exit(0);
  }, 5000)

  // const promises = JSON.parse(process.env.API_REQUESTS);
  // return ApiHelper.fetchRequests(promises)
  //   .then(res => {
  //
  //     console.log('Response :', res);
  //
  //     process.send({
  //       id: cluster.worker.id,
  //       isError: false
  //     });
  //     process.exit(0);
  //   }).catch(err => {
  //
  //     process.send({
  //       isError: true
  //     });
  //     process.exit(1);
  //   });


}


/**
 * Message listener
 */
process.on('message', msg => msg.workerType === 'logger' ? run(msg.config) : null);
