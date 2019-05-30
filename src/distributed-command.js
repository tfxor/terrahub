'use strict';

const ConfigCommand = require('./config-command');
const Distributor = require('./helpers/distributors/thread-distributor');
const CloudDistributor = require('./helpers/distributors/cloud-distributor');

class DistributedCommand extends ConfigCommand {


  getDistributor() {
    const config = this.getFilteredConfig();

    if(!this.distributor) {
      this.distributor = new Distributor(config);
    }

    return this.distributor;
  }

  getCloudDistributor() {
    const config = this.getFilteredConfig();

    if(!this.cloudDistributor) {
      this.cloudDistributor = new Distributor(config);
    }

    return this.cloudDistributor;
  }

}

module.exports = DistributedCommand;