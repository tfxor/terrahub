'use strict';

const path = require('path');
const Dictionary = require('./helpers/dictionary');
const AbstractCommand = require('./abstract-command');

class ConfigCommand extends AbstractCommand {
  // eslint-disable-next-line no-useless-constructor
  constructor(parameters, logger) {
    super(parameters, logger);
  }

  /**
   * @param {String} name
   * @return {String}
   * @public
   */
  getConfigPath(name) {
    const config = this.getConfig();
    const key = Object.keys(config).find(it => config[it].name === name);

    return config[key] ? path.join(config[key].project.root, config[key].root) : null;
  }

  /**
   * Get list of configuration files for the specified environment
   * @param {String|Boolean} dir
   * @returns {String[]}
   */
  listAllEnvConfig(dir = false) {
    return this._configLoader.listConfig({ dir: dir, env: Dictionary.ENVIRONMENT.EVERY });
  }

  /**
   * @param {String} fullPath
   * @returns {String}
   */
  relativePath(fullPath) {
    return this._configLoader.relativePath(fullPath);
  }

  /**
   * @returns {String}
   */
  getProjectFormat() {
    return this._configLoader.getProjectFormat();
  }

}

module.exports = ConfigCommand;
