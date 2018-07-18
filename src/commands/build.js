'use strict';

const util = require('../helpers/util');
const { exec } = require('child-process-promise');
const path = require('path');
const TerraformCommand = require('../terraform-command');

class BuildCommand extends TerraformCommand {
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
    const config = this.getConfig();

    return util.promiseSeries(Object.keys(config).map(hash => () => this.executeComponentBuild(config[hash])));
  }

  /**
   * @param {Object} config
   * @return {Promise}
   */
  executeComponentBuild(config) {
    const buildConfig = util.yamlToJson(path.join(config.root, 'build.yml'));

    if (buildConfig.env) {
      this
        .setProcessEnv(buildConfig.env.variables)
        .setProcessEnv(buildConfig.env["parameter-store"])
      ;
    }

    const commandsList = [];

    if (buildConfig.phases) {
      this
        .pushCommandsAndFinally(commandsList, buildConfig.phases.install)
        .pushCommandsAndFinally(commandsList, buildConfig.phases.pre_build)
        .pushCommandsAndFinally(commandsList, buildConfig.phases.build)
        .pushCommandsAndFinally(commandsList, buildConfig.phases.post_build)
      ;
    }

    if (buildConfig.artifacts) {
      if (buildConfig.artifacts.files) {
        const files = buildConfig.artifacts.files;
      }

      if (buildConfig.artifacts["discard-paths"]) {
        const discardPaths = buildConfig.artifacts["discard-paths"];
      }
    }

    if (buildConfig.cache && buildConfig.cache.paths) {
      const cachePaths = buildConfig.cache.paths;
    }

    return util.promiseSeries(commandsList.map(it => () => exec(it))).then(() => Promise.resolve());
  }

  /**
   * @param {Object} source
   * @return {BuildCommand}
   */
  setProcessEnv(source) {
    if (!source) {
      return this;
    }

    Object.keys(source).forEach(function (envKey) {
      process.env[envKey] = source[envKey];

      exec('echo ${' + envKey + '}', { env: { env_key: source[envKey] } }).then(result => {
        if (result.error) {
          this.logger.error(result.error);
        }
      });
    });

    return this;
  }

  /**
   * @param {Array} destination
   * @param {Object} source
   * @return {BuildCommand}
   */
  pushCommandsAndFinally(destination, source) {
    if (!source) {
      return this;
    }

    if (source.commands) {
      source.commands.forEach(it => destination.push(it));
    }

    if (source.finally) {
      source.finally.forEach(it => destination.push(it));
    }

    return this;
  }
}

module.exports = BuildCommand;
