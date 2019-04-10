'use strict';

const fse = require('fs-extra');
const Promise = require('bluebird');
const { join, sep } = require('path');
const fs = Promise.promisifyAll(require('fs'));
const { jitPath } = require('../parameters');
const { homePath, extend } = require('./util');

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
      const componentPath = join(config.project.root, config.root);

      if (!config.mapping.length) {
        config.mapping.push(componentPath);
      }

      config.template.locals = extend(config.template.locals, [{
        timestamp: Date.now(),
        component: {
          name: config.name,
          path: componentPath
        },
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
  static jitMiddleware(config) {
    const transformedConfig = this._transformConfig(config);
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

      return fse.outputJson(join(tmpPath, name), data, { spaces: 2 });
    });

    const src = join(config.project.root, config.root);
    const regEx = /\.terrahub.*(json|yml|yaml)$/;

    return fse.ensureDir(tmpPath)
      .then(() => {
        return fs.readdirAsync( src ).then( files => {
          return files.filter(src => !regEx.test(src));
        }).then( files => {
          files.forEach( file => {
            fse.ensureSymlink(src + sep + file, tmpPath + sep + file)
            .catch(() => {});
          })
        })
        .then(() => Promise.all(promises))
        .then(() => Promise.resolve(transformedConfig))
      })
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
