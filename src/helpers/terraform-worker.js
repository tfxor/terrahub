'use strict';

const cpuNum = require('os').cpus().length;
const cluster = require('cluster');

// @todo implement terraform worker

// if (cluster.isMaster) {
//   console.log('I am master', cpuNum);
//
//   for (let i = 0; i < cpuNum; i++) {
//     cluster.fork({ TEST: `worker - ${i}` });
//   }
//
//   // cluster.fork();
//   // cluster.fork();
//   // cluster.fork();
//
// } else if (cluster.isWorker) {
//   console.log('\n');
//   console.log(`I am worker #${cluster.worker.id}`, process.env.TEST);
//
//   // if (process.env.TEST === 3) {
//   process.exit(0);
//   // }
// }
