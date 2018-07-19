'use strict';

const { promiseSeries } = require('../helpers/util');
const { exec } = require('child-process-promise');
const { setMessageListener } = require('./worker-help');


function getTasks(queue) {
  return queue.map(config =>
    () => getComponentBuildPromise(config)
  );
}

/**
 * @param {Object} config
 * @return {Promise}
 */
function getComponentBuildPromise(config) {
  return new Promise(resolve => {
    const buildConfig = config.build;

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

    resolve(promiseSeries(commandsList.map(it => () => exec(it))));
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

setMessageListener(getTasks);
