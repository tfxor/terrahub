'use strict';

const cluster = require('cluster');
const ApiHelper = require('../api-helper');



function run(actions) {


}





/**
 * Message listener
 */
process.on('message', msg => msg.workerType === 'logger' ? run(msg.data) : null);
