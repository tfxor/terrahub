'use strict';

const { getComponentBuildTask } = require('./src/helpers/build-helper');
const AwsDeployer = require('./src/helpers/distributors/aws-cloud-deployer');

module.exports = {
  getComponentBuildTask,
  Distributors: {
    AWS: {
      AwsDeployer
    }
  }
};
