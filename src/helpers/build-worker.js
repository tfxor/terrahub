'use strict';

const cluster = require('cluster');
const { promiseSeries } = require('../helpers/util');
const { spawn } = require('child-process-promise');
const logger = require('./logger');

/**
 * @param {Object} env
 * @param {Object} sources
 */
function extendProcessEnv(env, ...sources) {
  sources.forEach(source => {
    if (source) {
      Object.assign(env, source);
    }
  });
}

/**
 * @param {Array} destination
 * @param {Object} sources
 */
function pushCommandsAndFinally(destination, ...sources) {
  sources.forEach(source => {
    if (source) {
      if (source.commands) {
        source.commands.forEach(it => destination.push(it));
      }

      if (source.finally) {
        source.finally.forEach(it => destination.push(it));
      }
    }
  });
}

/**
 * @param {Object} config
 * @return {Function}
 */
function getComponentBuildTask(config) {
  return () => new Promise((resolve, reject) => {
    const buildConfig = config.build;
    const name = config.name;

    const env = Object.assign({}, process.env);
    if (buildConfig.env) {
      extendProcessEnv(env, buildConfig.env.variables, buildConfig.env['parameter-store']);
    }

    const commandsList = [];

    if (buildConfig.phases) {
      pushCommandsAndFinally(
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

          if (!process.env.output && process.env.silent === 'false') {
            logger.raw(out(name, data));
          }
        });

        child.stderr.on('data', data => {
          if (!process.env.output && process.env.silent === 'false') {
            logger.error(out(name, data));
          }
        });

        return promise.then(() => Buffer.concat(stdout));
      })
    ).then(() => {
      printOutput(`Build successfully finished for [${name}].`, true);

      resolve();
    }).catch(err => {
      printOutput(`Build failed for [${name}].`, false);

      reject(err);
    });
  });
}

/**
 * @param {String} message
 * @param {Boolean} isSuccess
 */
function printOutput(message, isSuccess) {
  switch (process.env.output) {
    case 'json': {
      logger.log(JSON.stringify({ message: message }));
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
 */
function out(name, data) {
  return `[${name}] ${data.toString()}`;
}

/**
 * Runner
 * @param {Object[]} queue
 */
function run(queue) {
  promiseSeries(queue.map(config => getComponentBuildTask(config))).then(lastResult => {
    process.send({
      id: cluster.worker.id,
      data: lastResult,
      isError: false
    });
    process.exit(0);
  }).catch(error => {
    process.send({
      id: cluster.worker.id,
      error: error.message || error,
      isError: true
    });
    process.exit(1);
  });
}

/**
 * Message listener
 */
process.on('message', config => {
  let queue = [];

  /**
   * @param {Object} cfg
   */
  function handle(cfg) {
    queue.push(cfg);
    cfg.children.forEach(child => handle(child));
    cfg.children = [];
  }

  handle(config);
  run(queue);
});
