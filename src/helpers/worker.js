'use strict';

const fse = require('fs-extra');
const cluster = require('cluster');
const Terrahub = require('./terrahub');
const BuildHelper = require('./build-helper');
const { promiseSeries, homePath, extend } = require('./util');

/**
 * Parse terraform actions
 * @return {Array}
 */
function getActions() {
  return process.env.TERRAFORM_ACTIONS.split(',').filter(Boolean);
}

/**
 * Get task with hooks (if enabled)
 * @param {Object} config
 * @return {Function[]}
 */
function getTasks(config) {
  const terrahub = new Terrahub(config);

  return getActions().map(action =>
    (options) => (action !== 'build' ?
      terrahub.getTask(action, options) : BuildHelper.getComponentBuildTask(config))
  );
}

/**
 * Transform template config
 * @param {Object} config
 * @return {Object}
 */
function transformConfig(config) {
  config.isJit = config.hasOwnProperty('template');

  if (config.isJit) {
    config.template.locals = extend(config.template.locals, [{
      timestamp: Date.now(),
      project: {
        path: config.project.root,
        name: config.project.name,
        code: config.project.code
      }
    }]);
  }

  return config;
}

/**
 * JIT middleware (config to files)
 * @param {Object} config
 * @return {Promise}
 */
function jitMiddleware(config) {
  const cfg = transformConfig(config);

  if (!cfg.isJit) {
    return Promise.resolve(config);
  }

  const promises = Object.keys(cfg.template).map(it => {
    let name = `${it}.tf`;
    let data = { [it]: cfg.template[it] };

    switch (it) {
      case 'resource':
        name = 'main.tf';
        break;
      case 'tfvars':
        name = `${cfg.cfgEnv === 'default' ? '' : 'workspace/'}${cfg.cfgEnv}.tfvars`;
        data = cfg.template[it];
        break;
    }

    return fse.outputJson(homePath('jit', cfg.hash, name), data, { spaces: 2 });
  });

  return Promise.all(promises).then(() => Promise.resolve(cfg));
}

/**
 * BladeRunner
 * @param {Object} config
 */
function run(config) {
  jitMiddleware(config)
    .then(cfg => promiseSeries(getTasks(cfg), (prev, fn) => prev.then(data => fn(data ? { skip: !!data.skip } : {}))))
    .then(lastResult => {
      if (lastResult.action !== 'output') {
        delete lastResult.buffer;
      }

      process.send({
        id: cluster.worker.id,
        data: lastResult,
        isError: false,
        hash: config.hash
      });
      process.exit(0);
    })
    .catch(error => {
      process.send({
        id: cluster.worker.id,
        error: error.message || error,
        isError: true,
        hash: config.hash
      });
      process.exit(1);
    });
}

/**
 * Message listener
 */
process.on('message', run);
