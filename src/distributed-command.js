'use strict';

const ConfigCommand = require('./config-command');
const Distributor = require('./helpers/distributors/thread-distributor');
const CloudDistributor = require('./helpers/distributors/cloud-distributor');

class DistributedCommand extends ConfigCommand {



}

module.exports = DistributedCommand;