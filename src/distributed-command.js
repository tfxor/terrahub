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
      this.cloudDistributor = new CloudDistributor(config);
    }

    return this.cloudDistributor;
  }

  stopExecution() {
    //maybe make it
    if (this.distributor) {
      this.distributor.disconnect();
    }

    super.stopExecution();

  }
}

module.exports = DistributedCommand;