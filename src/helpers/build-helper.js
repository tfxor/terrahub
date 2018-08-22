'use strict';

const { promiseSeries } = require('../helpers/util');
const { spawn } = require('child-process-promise');
const logger = require('./logger');

class BuildHelper {
  /**
   * @param {Object} config
   * @return {Promise}
   */
  static getComponentBuildTask(config) {
    return new Promise((resolve, reject) => {
      const buildConfig = config.build;
      const name = config.name;

      const env = Object.assign({}, process.env);
      if (buildConfig.env) {
        this._extendProcessEnv(env, buildConfig.env.variables, buildConfig.env['parameter-store']);
      }

      const commandsList = [];

      if (buildConfig.phases) {
        this._pushCommandsAndFinally(
          commandsList,
          buildConfig.phases.install,
          buildConfig.phases.pre_build,
          buildConfig.phases.build,
          buildConfig.phases.post_build
        );
      }

      promiseSeries(commandsList.map(it => () => {
          const [command, ...args] = it.split(' ');
          const stdout = [];

          const promise = spawn(command, args, {
            cwd: process.cwd(),
            env: env,
            shell: true,
          });
          const child = promise.childProcess;

          child.stdout.on('data', data => {
            stdout.push(data);

            if (!process.env.format && process.env.silent === 'false') {
              logger.raw(this._out(name, data));
            }
          });

          child.stderr.on('data', data => {
            if (!process.env.format && process.env.silent === 'false') {
              logger.error(this._out(name, data));
            }
          });

          return promise.then(() => Buffer.concat(stdout));
        })
      ).then(() => {
        this._printOutput(`Build successfully finished for [${name}].`, true);

        resolve();
      }).catch(err => {
        this._printOutput(`Build failed for [${name}].`, false);

        reject(err);
      });
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
