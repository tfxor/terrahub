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
    const tmpPath = JitHelper.buildTmpPath(config);

    if (!transformedConfig.isJit) {
      return Promise.resolve(config);
    }

    const { template, cfgEnv } = transformedConfig;

    const promises = Object.keys(template).filter(it => template[it]).map(it => {
      let name = `${it}.tf`;
      let data = { [it]: template[it] };

      switch (it) {
        case 'resource':
          name = 'main.tf';
          break;

        case 'tfvars':
          name = path.join(cfgEnv === 'default' ? '' : 'workspace', `${cfgEnv}.tfvars`);
          data = template[it];
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

    // generate "variable.tf" if it is not described in config
    if (!template.hasOwnProperty('variable') && template.hasOwnProperty('tfvars')) {
      const data = { variable: {} };

      const { tfvars } = template;

      Object.keys(tfvars).forEach(it => {
        let type = typeof tfvars[it];

        if (Array.isArray(tfvars[it])) {
          type = 'list';
        } else if (type === 'object') {
          type = 'map';
        }

        data.variable[it] = { type };
      });

      promises.push(fse.outputJson(path.join(tmpPath, 'variable.tf'), data, { spaces: 2 }));
    }

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
   * @param {Object} config
   * @return {String}
   */
  static buildTmpPath(config) {
    return homePath(jitPath, `${config.name}_${config.project.code}`);
  }
}

module.exports = JitHelper;
