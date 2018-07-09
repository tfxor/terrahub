'use strict';

const os = require('os');
const fse = require('fs-extra');
const path = require('path');
const Args = require('../src/helpers/args-parser');
const { extend } = require('./helpers/util');

/**
 * Get home path
 * @param {String} suffix
 * @returns {*}
 * @private
 */
function _homePath(...suffix) {
  return path.join(os.homedir(), '.terrahub', ...suffix);
}

/**
 * Get environment
 * @param {Object} args
 * @return {String|*}
 * @private
 */
function _getEnv(args) {
  if (process.env.hasOwnProperty('THUB_ENV')) {
    args.env = args.e = process.env.THUB_ENV;
  }

  return args.env || args.e;
}

/**
 * Check if help needs to be shown
 * @param {Object} args
 * @return {Boolean|*}
 * @private
 */
function _isHelp(args) {
  return args.help || args.h || args._.includes('help') || false;
}

const cfgPath = _homePath('.terrahub.json');
const templates = path.join(__dirname, 'templates');
const args = Args.parse(process.argv.slice(2));

/**
 * Ensure if global config exists
 * @note it's always .json
 */
if (!fse.existsSync(cfgPath)) {
  fse.copySync(path.join(templates, 'configs', '.terrahub.json'), cfgPath);
}

const def = {
  env: 'default',
  api: 'api',
  token: false,
  format: 'yml'
};
const env = {
  env: _getEnv(args),
  api: process.env.THUB_API,
  token: process.env.THUB_ACCESS_TOKEN,
  format: process.env.THUB_CONFIG_FORMAT
};

const cfg = extend(def, [fse.readJsonSync(cfgPath, { throws: false }), env]);
const isDefault = cfg.env === 'default';

module.exports = {
  args: args,
  homePath: _homePath,
  commandsPath: path.join(__dirname, 'commands'),
  packageJson: path.join(__dirname, '..', 'package.json'),
  config: {
    api: cfg.api,
    env: cfg.env,
    home: _homePath(),
    token: cfg.token,
    format: cfg.format,
    isHelp: _isHelp(args),
    isDefault: isDefault,
    fileName: isDefault ? `.terrahub.${cfg.format}` : `.terrahub.${cfg.env}.${cfg.format}`
  },
  templates: {
    aws: path.join(templates, 'aws'),
    azurerm: path.join(templates, 'azurerm'),
    gcp: path.join(templates, 'gcp'),
    configs: path.join(templates, 'configs'),
    hooks: path.join(templates, 'hooks'),
    mapping: path.join(templates, 'mapping.json'),
    helpMetadata: path.join(templates, 'help', 'metadata.json'),
    helpDefault: path.join(templates, 'help', 'default.twig'),
    helpCommand: path.join(templates, 'help', 'command.twig')
  }
};
