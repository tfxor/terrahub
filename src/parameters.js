'use strict';

const os = require('os');
const fse = require('fs-extra');
const path = require('path');
const { extend } = require('./helpers/util');

/**
 * Get terrahub home paths
 * @param {String} suffix
 * @returns {*}
 * @private
 */
function _terrahubPath(...suffix) {
  return path.join(os.homedir(), '.terrahub', ...suffix);
}

const cfgPath = _terrahubPath('.terrahub.json');
const templates = path.join(__dirname, 'templates');

/**
 * Ensure if global config exists
 * @note it's always .json
 */
if (!fse.existsSync(cfgPath)) {
  fse.copySync(path.join(templates, 'configs', '.terrahub.json'), cfgPath);
}

const def = { format: 'yml', token: false, env: 'prod', api: 'api' };
const env = {
  api: process.env.THUB_API,
  env: process.env.THUB_ENV,
  token: process.env.THUB_ACCESS_TOKEN,
  format: process.env.THUB_CONFIG_FORMAT
};

const cfg = extend(def, [fse.readJsonSync(cfgPath, { throws: false }), env]);
const isProd = cfg.env === 'prod';

module.exports = {
  homePath: _terrahubPath,
  commandsPath: path.join(__dirname, 'commands'),
  config: {
    api: cfg.api,
    env: cfg.env,
    home: _terrahubPath(),
    token: cfg.token,
    format: cfg.format,
    isProd: isProd,
    fileName: isProd ? `.terrahub.${cfg.format}` : `.terrahub.${cfg.env}.${cfg.format}`
  },
  templates: {
    aws: path.join(templates, 'aws'),
    gcp: path.join(templates, 'gcp'),
    hooks: path.join(templates, 'hooks'),
    azurerm: path.join(templates, 'azurerm'),
    configs: path.join(templates, 'configs'),
    mapping: path.join(templates, 'mapping.json')
  }
};
