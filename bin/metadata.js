#!/usr/bin/env node

'use strict';

const logger = require('../src/helpers/logger');
const { updateMetadata } = require('../src/helpers/help-parser');

updateMetadata(false);
logger.info('Metadata updated');

process.exit(0);
