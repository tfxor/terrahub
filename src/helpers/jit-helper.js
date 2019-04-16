'use strict';

const path = require('path');
const yaml = require('js-yaml');
const fse = require('fs-extra');
const S3Helper = require('./s3-helper');
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

    if (!transformedConfig.isJit) {
      return Promise.resolve(config);
    }

    const { template } = transformedConfig;

    return Promise.resolve().then(() => {
      // add "tfvars" if it is not described in config
      if (!template.hasOwnProperty('tfvars') && template.hasOwnProperty('remote_tfvars')) {
        return JitHelper._addTfvars(config);
      }
    }).then(() => JitHelper._createTerraformFiles(config))
      .then(() => {
        // generate "variable.tf" if it is not described in config
        if (!template.hasOwnProperty('variable') && template.hasOwnProperty('tfvars')) {
          return JitHelper._generateVariable(config);
        }
      })
      .then(() => JitHelper._symLinkNonTerraHubFiles(config))
      .then(() => config);
  }

  /**
   * @param {Object} config
   * @return {Promise}
   */
  static _addTfvars(config) {
    const { template } = config;
    const { remote_tfvars: { bucket, prefix } } = template;

    return JitHelper.s3Helper.getObject(bucket, prefix).then(data => {
      const json = yaml.safeLoad(data.Body.toString());

      template['tfvars'] = json.component.template.tfvars;
      delete template['remote_tfvars'];
    });
  }

  /**
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  static _createTerraformFiles(config) {
    const { template, cfgEnv } = config;
    const tmpPath = JitHelper.buildTmpPath(config);

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
      }

      return fse.outputJson(path.join(tmpPath, name), data, { spaces: 2 });
    });

    return Promise.all(promises);
  }

  /**
   * @param {Object} config
   * @private
   */
  static _generateVariable(config) {
    const variable = {};
    const tmpPath = JitHelper.buildTmpPath(config);

    const { tfvars } = config.template;

    Object.keys(tfvars).forEach(it => {
      let type = typeof tfvars[it];

      if (Array.isArray(tfvars[it])) {
        type = 'list';
      } else if (type === 'object') {
        type = 'map';
      }

      variable[it] = { type };
    });

    return fse.outputJson(path.join(tmpPath, 'variable.tf'), { variable }, { spaces: 2 });
  }

  static _symLinkNonTerraHubFiles(config) {
    const regEx = /\.terrahub.*(json|yml|yaml)$/;
    const tmpPath = JitHelper.buildTmpPath(config);
    const src = path.join(config.project.root, config.root);

    return fse.ensureDir(tmpPath)
      .then(() => fse.readdir(src))
      .then(files => {
        const nonTerrahubFiles = files.filter(src => !regEx.test(src));

        const promises = nonTerrahubFiles.map(file =>
          fse.ensureSymlink(path.join(src, file), path.join(tmpPath, file)).catch(() => {})
        );

        return Promise.all(promises);
      })
      .catch(err => {
        throw new Error(err.toString());
      });
  }

  /**
   * @return {S3Helper}
   * @private
   */
  static get s3Helper() {
    if (!JitHelper._s3Helper) {
      JitHelper._s3Helper = new S3Helper();
    }

    return JitHelper._s3Helper;
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
