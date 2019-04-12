'use strict';

const path = require('path');
const fse = require('fs-extra');
const { jitPath } = require('../parameters');
const { homePath, extend, sliceObject } = require('./util');

class JitHelper {
  /**
   * Transform template config
   * @param {Object} config
   * @return {Object}
   * @private
   */
  static _transformConfig(config) {
    config.isJit = config.hasOwnProperty('template');

    if (config.isJit) {
      const componentPath = path.join(config.project.root, config.root);

      config.template.locals = extend(config.template.locals, [{
        timestamp: Date.now(),
        component: {
          name: config.name,
          path: componentPath
        },
        project: sliceObject(config.project, ['path', 'name', 'code'])
      }]);
    }

    return config;
  }

  /**
   * JIT middleware (config to files)
   * @param {Object} config
   * @return {Promise}
   */
  static jitMiddleware(config) {
    const transformedConfig = JitHelper._transformConfig(config);
    const tmpPath = homePath(jitPath, transformedConfig.hash);

    if (!transformedConfig.isJit) {
      return Promise.resolve(config);
    }

    const promises = Object.keys(transformedConfig.template).map(it => {
      if (!transformedConfig.template[it]) {
        return Promise.resolve();
      }

      let name = `${it}.tf`;
      let data = { [it]: transformedConfig.template[it] };

      switch (it) {
        case 'resource':
          name = 'main.tf';
          break;
        case 'tfvars':
          name = `${transformedConfig.cfgEnv === 'default' ? '' : 'workspace/'}${transformedConfig.cfgEnv}.tfvars`;
          data = transformedConfig.template[it];
          break;
      }

      return fse.outputJson(path.join(tmpPath, name), data, { spaces: 2 });
    });

    const src = path.join(config.project.root, config.root);
    const regEx = /\.terrahub.*(json|yml|yaml)$/;

    return fse.ensureDir(tmpPath)
      .then(() => {
        return fse.readdir(src).then(files => {
          const nonTerrahubFiles = files.filter(src => !regEx.test(src));

          return Promise.all(nonTerrahubFiles.map(file => {
            return fse.ensureSymlink(path.join(src, file), path.join(tmpPath, file)).catch(() => {});
          }));
        });
      })
      .then(() => Promise.all(promises))
      .then(() => transformedConfig)
      .catch(err => {
        throw new Error(err.toString());
      });
  }

  /**
   * @param {String} config
   * @return {String}
   */
  static buildTmpPath(config) {
    return homePath(jitPath, config.hash);
  }
}

module.exports = JitHelper;
