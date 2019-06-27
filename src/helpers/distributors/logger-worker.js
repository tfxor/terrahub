'use strict';

const cluster = require('cluster');
const ApiHelper = require('../api-helper');



function run(promises) {

  ApiHelper.fetchRequests(promises).then(res => {
    console.log('Response from worker :', res);
    setTimeout(() => {
      process.send({
        isLogger: true,
        isBusy: false,
        isError: false
      });

    }, 2000);

    // process.exit(0);
  }).catch(err => {
    process.send({
      isLogger: true,
      isError: true
    });

    process.exit(1);
  });

}





/**
 * Message listener
 */
process.on('message', msg => msg.workerType === 'logger' ? run(msg.data) : null);
