'use strict';

const path = require('path');
const fse = require('fs-extra');
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
      const componentPath = path.join(config.project.root, config.root);

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
    const transformedConfig = JitHelper._transformConfig(config);
    const tmpPath = homePath(jitPath, transformedConfig.name + "_" + transformedConfig.project.code);

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
        case 'remote_tfvars':
          console.log(transformedConfig);
          name = `${transformedConfig.cfgEnv === 'default' ? '' : 'workspace/'}${transformedConfig.cfgEnv}.tfvars`;
          data = transformedConfig.template[it];
          break;
      }
      return fse.outputJson(path.join(tmpPath, name), data, { spaces: 2 });
    });
    process.exit();

    if (!transformedConfig.template.hasOwnProperty('variable') &&
        transformedConfig.template.hasOwnProperty('tfvars')) {
      let name = 'variable.tf';
      let data = {'variable': {}};
      Object.keys(transformedConfig.template['tfvars']).map(it => {
        let type = typeof transformedConfig.template['tfvars'][it];
        if (type == 'object') {
          switch (Array.isArray(transformedConfig.template['tfvars'][it])) {
            case false:
              type = 'map';
              break;
            case true:
              type = 'list';
              break;
          }
        }
        data['variable'][it] = {'type': type};
      });
      
      promises.push(fse.outputJson(path.join(tmpPath, name), data, { spaces: 2 }));
    }
   
    const src = path.join(config.project.root, config.root);
    const regEx = /\.terrahub.*(json|yml|yaml)$/;

    return fse.ensureDir(tmpPath)
      .then(() => {
        return fse.readdir(src).then(files => {
          return Promise.all(files.filter(src => !regEx.test(src)).map(file => {
            return fse.ensureSymlink(path.join(src, file), path.join(tmpPath, file)).catch(() => {});
          }));
        })
        .then(() => Promise.all(promises))
        .then(() => transformedConfig)
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
    return homePath(jitPath, config.name + "_" + config.project.code);
  }
}

module.exports = JitHelper;
