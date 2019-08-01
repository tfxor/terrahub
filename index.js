'use strict';

// const { getComponentBuildTask } = require('./src/helpers/build-helper');
const AwsCloudDeployer = require('./src/helpers/distributors/aws-cloud-deployer');

module.exports = {
  // getComponentBuildTask,
  CloudDeployers: {
    AwsCloudDeployer
  }
};
