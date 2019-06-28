'use strict';

const cluster = require('cluster');
const { fetch } = require('../../parameters');


function run(promises) {

  const _promises = promises.map(({ url, body }) => {
    return fetch.post(url, {
      body: JSON.stringify(body)
    }).catch(err => console.log(err));
  });

  return Promise.all(_promises).then(res => {
    console.log('from worker:', res);

    process.send({
      isLogger: true,
      isBusy: false,
      isError: false
    });

    process.exit(0);

  }).catch(err => {
    process.send({
      isLogger: true,
      isError: true
    });

    process.exit(1);
  });
  //
  // ApiHelper.fetchRequests(promises).then(res => {
  //   console.log('responses :', res);
  //   // setTimeout(() => {
  //     process.send({
  //       isLogger: true,
  //       isBusy: false,
  //       isError: false
  //     });
  //     process.exit(0);
  //
  //   // }, 2000);
  //
  // }).catch(err => {
  //   process.send({
  //     isLogger: true,
  //     isError: true
  //   });
  //
  //   process.exit(1);
  // });

}





/**
 * Message listener
 */
process.on('message', msg => msg.workerType === 'logger' ? run(msg.promises) : null);
