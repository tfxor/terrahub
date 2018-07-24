'use strict';

const logger = require('../src/helpers/logger');
const { updateMetadata } = require('../src/helpers/help-parser');

updateMetadata();
logger.info('Done');

process.exit(0);
