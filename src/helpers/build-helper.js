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

    const env = Object.assign({}, process.env);
    if (buildConfig.env) {
      BuildHelper._extendProcessEnv(env, buildConfig.env.variables, buildConfig.env['parameter-store']);
    }

    const commandsList = [];

    if (buildConfig.phases) {
      BuildHelper._pushCommandsAndFinally(
        commandsList, ...['install', 'pre_build', 'build', 'post_build'].map(it => buildConfig.phases[it])
      );
    }

    return promiseSeries(commandsList.map(it =>
      () => {
        let fullCommand = it;

        if (it.constructor === Object) {
          const key = Object.keys(it)[0];

          fullCommand = [key, it[key]].join(': ');
        }

        const isVerbose = !process.env.format && process.env.silent === 'false';
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
      })
    ).then(() => {
      BuildHelper._printOutput(BuildHelper._out(`Build successfully finished.`, name), true);

      return Promise.resolve({ action: 'build' });
    }).catch(err => {
      BuildHelper._printOutput(BuildHelper._out(`Build failed.`, name), false);

      return Promise.reject(err);
    });
  }

  /**
   * @param {Object} env
   * @param {Object} sources
   * @private
   */
  static _extendProcessEnv(env, ...sources) {
    sources.forEach(source => {
      if (source) {
        Object.assign(env, source);
      }
    });
  }

  /**
   * @param {Array} destination
   * @param {Object} sources
   * @private
   */
  static _pushCommandsAndFinally(destination, ...sources) {
    sources.forEach(source => {
      if (source) {
        if (source.commands) {
          destination.push(...source.commands);
        }

        if (source.finally) {
          destination.push(...source.finally);
        }
      }
    });
  }

  /**
   * @param {String} message
   * @param {Boolean} isSuccess
   * @private
   */
  static _printOutput(message, isSuccess) {
    switch (process.env.format) {
      case 'json': {
        const json = {
          message: message,
          error: isSuccess ? '0' : '1'
        };

        logger.log(JSON.stringify(json));
        break;
      }

      case 'text': {
        if (isSuccess) {
          logger.info(message);
        } else {
          logger.error(message);
        }
      }
    }
  }

  /**
   * @param {String} name
   * @param {Buffer} data
   * @return {string}
   * @private
   */
  static _out(name, data) {
    return `[${name}] ${data.toString()}`;
  }
}

module.exports = BuildHelper;
