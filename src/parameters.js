'use strict';

const path = require('path');
const fse = require('fs-extra');
const Fetch = require('./helpers/fetch');
const Args = require('./helpers/args-parser');
const { extend, homePath } = require('./helpers/util');

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

const cfgPath = homePath('.terrahub.json');
const templates = path.join(__dirname, 'templates');
const args = Args.parse(process.argv.slice(2));

/**
 * Ensure if global config exists
 * @note it's always .json
 */
if (!fse.existsSync(cfgPath)) {
  fse.copySync(path.join(templates, 'config', '.terrahub.json'), cfgPath);
}

const def = {
  env: 'default',
  api: 'api',
  logs: false,
  token: false,
  listLimit: 5,
  retryCount: 2,
  format: 'yml',
  threadLimit: 0,
  usePhysicalCpu: false
};
const env = {
  env: _getEnv(args),
  api: process.env.THUB_API,
  token: process.env.THUB_TOKEN,
  format: process.env.THUB_CONFIG_FORMAT
};

const cfg = extend(def, [fse.readJsonSync(cfgPath, { throws: false }), env]);
const apiBase = `https://${cfg.api}.terrahub.io/v1/`;
const isDefault = cfg.env === 'default';

module.exports = {
  args: args,
  cfgPath: cfgPath,
  hclPath: path.join('cache', 'hcl'),
  tfstatePath: path.join('cache', 'tfstate'),
  fetch: new Fetch(apiBase, cfg.token),
  binPath: path.join(__dirname, '..', 'bin'),
  commandsPath: path.join(__dirname, 'commands'),
  packageJson: path.join(__dirname, '..', 'package.json'),
  config: {
    api: cfg.api,
    env: cfg.env,
    logs: cfg.logs,
    token: cfg.token,
    format: cfg.format,
    isDefault: isDefault,
    isHelp: _isHelp(args),
    listLimit: cfg.listLimit,
    retryCount: cfg.retryCount,
    usePhysicalCpu: cfg.usePhysicalCpu,
    threadLimit: cfg.threadLimit,
    defaultFileName: `.terrahub.${cfg.format}`
  },
  templates: {
    path: templates,
    help: path.join(templates, 'help'),
    config: path.join(templates, 'config'),
    workspace: path.join(templates, 'terraform', 'workspace'),
    helpMetadata: path.join(templates, 'help', 'metadata.json'),
    helpDefault: path.join(templates, 'help', 'default.twig'),
    helpCommand: path.join(templates, 'help', 'command.twig')
  }
};
