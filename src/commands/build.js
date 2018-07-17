'use strict';

const yaml = require('js-yaml');
const fs = require('fs');

const config = yaml.safeLoad(fs.readFileSync('build.yml', 'utf8'));

const util = require('util');
const { exec } = require('child-process-promise');
const AbstractCommand = require('../abstract-command');

class BuildCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('build')
      .setDescription('build software from predefined build.yml config files')
    ;
  }

  /**
   * @return {Promise}
   */
  run() {
    const commandsList = [];

    // declare env
    if (config.env && config.env.variables) {
      Object.keys(config.env.variables).forEach((env_key) => {
        process.env[env_key] = config.env.variables[env_key];

        exec('echo ${' + env_key + '}', { env: { env_key: config.env.variables[env_key] } }).then(result => {
          if (result.error) {
            throw result.error;
          }
        });
      });
    }

    // declare parameter-store
    if (config.env && config.env["parameter-store"]) {
      Object.keys(config.env["parameter-store"]).forEach(function (env_key) {
        process.env[env_key] = config.env["parameter-store"][env_key];

        exec('echo ${' + env_key + '}', { env: { env_key: config.env["parameter-store"][env_key] } }).then(result => {
          if (result.error) {
            throw result.error;
          }
        });
      });
    }

    // phases
    if (config.phases) {
      // phases install
      this.pushCommandsAndFinally(commandsList, config.phases.install);

      // phases pre_build
      this.pushCommandsAndFinally(commandsList, config.phases.pre_build);

      // phases build
      this.pushCommandsAndFinally(commandsList, config.phases.build);

      // phases post_build
      this.pushCommandsAndFinally(commandsList, config.phases.post_build);
    }

    // artifacts
    if (config.artifacts) {
      // files
      if (config.artifacts.files) {
        const files = config.artifacts.files;
      }

      // discard-paths
      if (config.artifacts["discard-paths"]) {
        const discard_paths = config.artifacts["discard-paths"];
      }
    }

    // cache
    if (config.cache && config.cache.paths) {
      const cache_paths = config.cache.paths;
    }

    return this.executeBash(commandsList);
  }

  /**
   * @param {Array} destination
   * @param {Object} source
   */
  pushCommandsAndFinally(destination, source) {
    if (!source) {
      return;
    }

    if (source.commands) {
      source.commands.forEach(it => destination.push(it));
    }

    if (source.finally) {
      source.finally.forEach(it => destination.push(it));
    }
  }

  /**
   * @param {Array<String>} commands
   * @param {Number} index
   * @return {Promise}
   */
  executeBash(commands, index = 0) {
    return exec(commands[index]).then(result => {
      if (result.error) {
        throw result.error;
      }

      if (index + 1 < commands.length) {
        return this.executeBash(commands, index + 1);
      }
    });
  }
}

module.exports = BuildCommand;
