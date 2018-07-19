'use strict';

const cluster = require('cluster');
const { promiseSeries, yamlToJson } = require('../helpers/util');
const { exec } = require('child-process-promise');
const path = require('path');

/**
 * @param {Object} config
 * @return {Function}
 */
function getComponentBuildTask(config) {
  return () => new Promise(resolve => {
    const buildConfig = yamlToJson(path.join(config.root, 'build.yml'));

    if (buildConfig.env) {
      setProcessEnv(buildConfig.env.variables);
      setProcessEnv(buildConfig.env["parameter-store"]);
    }

    const commandsList = [];

    if (buildConfig.phases) {
      pushCommandsAndFinally(commandsList, buildConfig.phases.install);
      pushCommandsAndFinally(commandsList, buildConfig.phases.pre_build);
      pushCommandsAndFinally(commandsList, buildConfig.phases.build);
      pushCommandsAndFinally(commandsList, buildConfig.phases.post_build);
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

    if (config.name === 'prayforthewicked') {
      setTimeout(() => {
        resolve(promiseSeries(commandsList.map(it => () => exec(it))));
      }, 5000);
    } else {
      resolve(promiseSeries(commandsList.map(it => () => exec(it))));
    }
  });
}

/**
 * @param {Object} source
 */
function setProcessEnv(source) {
  if (!source) {
    return;
  }

  Object.keys(source).forEach(function (envKey) {
    process.env[envKey] = source[envKey];

    exec('echo ${' + envKey + '}', { env: { env_key: source[envKey] } }).then(result => {
      if (result.error) {
        this.logger.error(result.error);
      }
    });
  });
}

/**
 * @param {Array} destination
 * @param {Object} source
 */
function pushCommandsAndFinally(destination, source) {
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
