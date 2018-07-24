'use strict';

const cluster = require('cluster');
const { promiseSeries } = require('../helpers/util');
const { exec } = require('child-process-promise');

/**
 * @param {Object} sources
 */
function buildProcessEnv(...sources) {
  const env = {};

  sources.forEach(source => {
    if (source) {
      Object.assign(env, source);
    }
  });

  return env;
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
  return () => new Promise(resolve => {
    const buildConfig = config.build;

    let env = null;
    if (buildConfig.env) {
      env = buildProcessEnv(buildConfig.env.variables, buildConfig.env['parameter-store']);
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

    resolve(promiseSeries(commandsList.map(it => () => exec(it, { env: env }))));
  });
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
