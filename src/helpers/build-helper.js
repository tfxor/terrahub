'use strict';

const path = require('path');
const logger = require('./logger');
const { promiseSeries, spawner } = require('./util');

class BuildHelper {
  /**
   * @param {Object} config
   * @return {Promise}
   */
  static getComponentBuildTask(config) {
    const { build: buildConfig, name } = config;

    const env = Object.assign({}, process.env, BuildHelper._extractEnvVars(buildConfig));
    const commandsList = BuildHelper._extractCommandsList(buildConfig);

    return promiseSeries(commandsList.map(it =>
      () => {
        let fullCommand = it;

        if (it.constructor === Object) {
          const key = Object.keys(it)[0];

          fullCommand = [key, it[key]].join(': ');
        }

        const isVerbose = !process.env.format;
        const [command, ...args] = fullCommand.split(' ');
        const options = {
          cwd: path.join(config.project.root, config.root),
          env: env,
          shell: true
        };

        return spawner(command, args, options,
          err => {
            if (isVerbose) {
              logger.error(BuildHelper._out(name, err));
            }
          },
          data => {
            if (isVerbose) {
              logger.raw(BuildHelper._out(name, data));
            }
          }
        );
      }
    )).then(() => {
      BuildHelper._printOutput(BuildHelper._out(name, `Build successfully finished.`), true);

      return Promise.resolve({ action: 'build' });
    }).catch(error => {
      BuildHelper._printOutput(BuildHelper._out(name, `Build failed.`), false);

      return Promise.reject(error);
    });
  }

  /**
   * @param {Object} buildConfig
   * @return {Object}
   * @private
   */
  static _extractEnvVars(buildConfig) {
    const { env } = buildConfig;

    if (!env) {
      return {};
    }

    return Object.assign({}, ...['variables', 'parameter-store'].map(it => env[it]).filter(Boolean));
  }

  /**
   * @param {Object} buildConfig
   * @return {String[]}
   * @private
   */
  static _extractCommandsList(buildConfig) {
    const { phases } = buildConfig;

    if (!phases) {
      return [];
    }

    return [].concat(
      ...['install', 'pre_build', 'build', 'post_build']
        .map(it => phases[it])
        .filter(Boolean)
        .map(phase => [].concat(
          ...['commands', 'finally']
            .map(it => phase[it])
            .filter(Boolean)
        ))
    );
  }

  /**
   * @param {String} message
   * @param {Boolean} isSuccess
   * @private
   */
  static _printOutput(message, isSuccess) {
    switch (process.env.format) {
      case 'json':
        const json = {
          message: message,
          error: isSuccess ? '0' : '1'
        };

        logger.log(JSON.stringify(json));
        break;

      case 'text':
      default:
        logger[isSuccess ? 'info' : 'error'](message);
        break;
    }
  }

  /**
   * @param {String} name
   * @param {Buffer|String} data
   * @return {String}
   * @private
   */
  static _out(name, data) {
    return `[${name}] ${data.toString()}`;
  }
}

module.exports = BuildHelper;
