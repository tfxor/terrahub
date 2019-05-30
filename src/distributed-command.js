'use strict';

const ConfigCommand = require('./config-command');
const Distributor = require('./helpers/distributors/thread-distributor');
const CloudDistributor = require('./helpers/distributors/cloud-distributor');

class DistributedCommand extends ConfigCommand {


  getDistributor(config) {
    if(!this.distributor) {
      this.distributor = new Distributor(config);
    }

    return this.distributor;
  }

  getCloudDistributor(config) {
    if(!this.cloudDistributor) {
      this.cloudDistributor = new Distributor(config);
    }

    return this.cloudDistributor;
  }

}

module.exports = DistributedCommand;