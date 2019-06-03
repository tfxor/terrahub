'use strict';

const path = require('path');
const yaml = require('js-yaml');
const fse = require('fs-extra');
const S3Helper = require('./s3-helper');
const GsHelper = require('./gs-helper');
const hcltojson = require('hcl-to-json');
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

      const localTfstatePath = JitHelper._normalizeBackendLocalPath(config);
      const remoteTfstatePath = JitHelper._normalizeBackendS3Key(config);

      config.template.locals = extend(config.template.locals, [{
        timestamp: Date.now(),
        component: {
          name: config.name,
          path: componentPath,
          local: localTfstatePath,
          remote: remoteTfstatePath
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
   * Normalize Backend Local config
   * @param {Object} config
   * @return {String}
   * @private
   */
  static _normalizeBackendLocalPath(config) {
    const { template } = config;
    const { terraform: { backend: { local } } } = template;
    const localTfstatePath = template.locals.component.local ||
      path.resolve('/tmp/.terrahub/local_tfstate/', config.project.name);

    if (local) {
      Object.keys(local).filter(it => local[it]).map(() => {
        const { path } = local;
        if (path) {
          local.path = path.replace(/\$\{local.component\["local"\]\}/g, localTfstatePath);
        }
      });
    }

    return localTfstatePath;
  }

  /**
   * Normalize Backend S3 config
   * @param {Object} config
   * @return {String}
   * @private
   */
  static _normalizeBackendS3Key(config) {
    const { template } = config;
    const { terraform: { backend: { s3 } } } = template;
    const remoteTfstatePath = template.locals.component.remote ||
      path.join('terraform', config.project.name);

    if (s3) {
      Object.keys(s3).filter(it => s3[it]).map(() => {
        const { key } = s3;
        if (key) {
          s3.key = key.replace(/\$\{local.component\["remote"\]\}/g, remoteTfstatePath);
        }
      });
    }

    return remoteTfstatePath;
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

    return Promise.resolve().then(() => JitHelper._moduleSourceRefactoring(template))
      .then(() => {
      // add "tfvars" if it is not described in config
      const remoteTfvarsLinks = JitHelper._extractOnlyRemoteTfvarsLinks(config);
      if (remoteTfvarsLinks.length > 0) {
        return JitHelper._addTfvars(config, remoteTfvarsLinks.shift().replace(/'/g, ''));
      }
    }).then(() => JitHelper._createTerraformFiles(config))
      .then(() => {
        // generate "variable.tf" if it is not described in config
        if (template.hasOwnProperty('tfvars')) {
          return JitHelper._generateVariable(config);
        }
      })
      .then(() => JitHelper._symLinkNonTerraHubFiles(config))
      .then(() => config);
  }

  /**
   * @param {Object} template
   * @return {Promise}
   * @private
   */
  static _moduleSourceRefactoring(template) {
    const { module } = template;
    if (module) {
      const promises = Object.keys(module).filter(it => module[it]).map(it => {
        const { source } = module[it];
        if (source) {
          module[it].source = path.resolve(template.locals.component.path, source);
        }
      });
      
      return Promise.all(promises);
    } 

    return Promise.resolve();
  }

  /**
   * @param {Object} config
   * @param {String} remoteTfvarsLink
   * @return {Promise}
   */
  static _addTfvars(config, remoteTfvarsLink) {
    const { template } = config;
    const regExBucket = /(?<=(s3|gs):\/\/)(.+?)([^\/]+)/gm;
    const bucket = remoteTfvarsLink.match(regExBucket).shift();
    const regExPrefix = new RegExp("(?<=" + bucket + "\/)(.+?)$");
    const prefix = remoteTfvarsLink.match(regExPrefix).shift();
    const tfvars = config.template.tfvars || {};

    const promise = (remoteTfvarsLink.substring(0, 2) === 'gs') ? 
      JitHelper.gsHelper.getObject(bucket, prefix).then(data => {
        template['tfvars'] = JSON.parse((JSON.stringify(tfvars) +
          JSON.stringify(hcltojson(data.toString()))).replace(/}{/g,","));
      }):
      JitHelper.s3Helper.getObject(bucket, prefix).then(data => {
        template['tfvars'] = JSON.parse((JSON.stringify(tfvars) +
        JSON.stringify(hcltojson(data.Body.toString()))).replace(/}{/g,","));
      });
    

    return promise;
  }

  /**
   * @param {Object} config
   * @return {Array}
   * @private
   */
  static _extractOnlyRemoteTfvarsLinks(config) {
    const { terraform: { varFile } } = config;
    const regEx = /(s3|gs):\/\/.+.tfvars/gm;

    return varFile.filter(src => regEx.test(src));
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
    const variable = config.template.variable || {};
    
    const tmpPath = JitHelper.buildTmpPath(config);

    const { tfvars } = config.template;

    Object.keys(tfvars).forEach(it => {
      let type = 'string';

      if (Array.isArray(tfvars[it])) {
        type = 'list';
      } else if (typeof tfvars[it] === 'object') {
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
   * @return {GsHelper}
   * @private
   */
  static get gsHelper() {
    if (!JitHelper._gsHelper) {
      JitHelper._gsHelper = new GsHelper();
    }

    return JitHelper._gsHelper;
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
