'use strict';

const os = require('os');
const path = require('path');

const templates = path.join(__dirname, './templates');
const configFormat = process.env.THUB_CONFIG_FORMAT || 'yml';
const terrahubToken = process.env.THUB_ACCESS_TOKEN || false;

/**
 * Get terrahub home paths
 * @param {String} suffix
 * @returns {*}
 * @private
 */
function _terrahubPath(...suffix) {
  return path.join(os.homedir(), '.terrahub', ...suffix);
}

module.exports = {
  thbPath: _terrahubPath,
  config: {
    home: _terrahubPath(),
    token: terrahubToken,
    format: configFormat,
    fileName: `.terrahub.${configFormat}`,
  },
  templates: {
    aws: `${templates}/aws`,
    hooks: `${templates}/hooks`,
    configs: `${templates}/configs`,
    mapping: `${templates}/mapping.json`
  }
};
