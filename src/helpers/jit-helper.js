'use strict';

const path = require('path');
const fse = require('fs-extra');
const S3Helper = require('./s3-helper');
const GsHelper = require('./gs-helper');
const hcltojson = require('hcl-to-json');
const { jitPath, tfstatePath } = require('../parameters');
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
    const { locals } = template;
    let localTfstatePath = homePath(tfstatePath, config.project.name);

    if (locals) {
      Object.keys(locals).filter(it => locals[it]).map(() => {
        const { component } = locals;
        if (component && component.local) {
          localTfstatePath = component.local;
        }
      });
    }
    
    const { terraform } = template;

    if (terraform) {
      const { backend } = terraform;
      if (backend) {
        const { local } = backend;
        if (local) {
          Object.keys(local).filter(it => local[it]).map(() => {
            const { path } = local;
            if (path) {
              local.path = path.replace(/\$\{local.component\["local"\]\}/g, localTfstatePath);
            }
          });
        }
      }
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
    const { locals } = template;
    let remoteTfstatePath = path.join('terraform', config.project.name);

    if (locals) {
      Object.keys(locals).filter(it => locals[it]).map(() => {
        const { component } = locals;
        if (component && component.remote) {
          localTfstatePath = component.remote;
        }
      });
    }
    
    const { terraform } = template;
    if (terraform) {
      const { backend } = terraform;
      if (backend) {
        const { s3 } = backend;
        if (s3) {
          Object.keys(s3).filter(it => s3[it]).map(() => {
            const { key } = s3;
            if (key) {
              s3.key = key.replace(/\$\{local.component\["remote"\]\}/g, remoteTfstatePath);
            }
          });
        }
      }
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
      const localTfvarsLinks = JitHelper._extractOnlyLocalTfvarsLinks(config);
      if (localTfvarsLinks.length > 0) {
        return JitHelper._addLocalTfvars(config, localTfvarsLinks.pop());
      }
    }).then(() => {
      // add "tfvars" if it is not described in config
      const remoteTfvarsLinks = JitHelper._extractOnlyRemoteTfvarsLinks(config);
      if (remoteTfvarsLinks.length > 0) {
        return JitHelper._addTfvars(config, remoteTfvarsLinks.shift().replace(/'/g, ''));
      }
    })
      .then(() => JitHelper._normalizeProvidersForResource(config))
      .then(() => JitHelper._normalizeProvidersForData(config))
      .then(() => JitHelper._normalizeTfvars(config))
      .then(() => JitHelper._createTerraformFiles(config))
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
   * 
   * @param {Object} config 
   * @return {Promise}
   * @private
   */
  static _normalizeProvidersForResource(config) {
    const { template } = config;
    const { resource } = template;

    if (resource) {
      const promises = Object.keys(resource).filter(resourceType => resource[resourceType])
        .map(resourceType => {
          const resourcesByType = resource[resourceType];
          return JitHelper._parsingResourceByType(resourcesByType, template);
        });
      
      return Promise.all(promises);
    }

    return Promise.resolve();
  }

  /**
   * 
   * @param {Object} config 
   * @return {Promise}
   * @private
   */
  static _normalizeProvidersForData(config) {
    const { template } = config;
    const { data } = template;

    if (data) {
      const promises = Object.keys(data).filter(resourceType => data[resourceType])
        .map(resourceType => {
          const resourcesByType = data[resourceType];
          return JitHelper._parsingResourceByType(resourcesByType, template);
        });
      
      return Promise.all(promises);
    }

    return Promise.resolve();
  }

  /**
   * 
   * @param {Object} resourcesByType 
   * @param {Object} template 
   * @return {Promise}
   * @private
   */
  static _parsingResourceByType(resourcesByType, template) {
    const promises = Object.keys(resourcesByType).filter(resourceName => resourcesByType[resourceName])
      .map(resourceName => {
        const resourceByName = resourcesByType[resourceName];
        if (! resourceByName.hasOwnProperty('provider')) {
          return Promise.resolve();
        }

        return JitHelper._parsingResourceByName(resourcesByType, resourceName, template);        
    });

    return Promise.all(promises);
  }

   /**
   * 
   * @param {Object} resourcesByType 
   * @param {String} resourceName
   * @param {Object} template 
   * @return {Promise}
   * @private
   */
  static _parsingResourceByName(resourcesByType, resourceName, template) {
    return Promise.resolve().then(() => {
      const resourceByName = resourcesByType[resourceName];
      const providerTerrahubVariables = JitHelper._extractTerrahubVariables(
        JSON.stringify(resourceByName['provider'])
      );
      
      return providerTerrahubVariables;
    }).then(providerTerrahubVariables => {

      if (!providerTerrahubVariables) {
        return Promise.resolve();
      }
      const providerTerrahubVariable = providerTerrahubVariables[0];
      const { variableName } = JitHelper._extractTerrahubVariableName(
        providerTerrahubVariable
      );
      const oldProviderTerrahubVariable = providerTerrahubVariable.replace(/\\"/gm, '\"');        
      const { tfvars } = template;
      if (!tfvars && !tfvars.hasOwnProperty(variableName)) {
        return Promise.resolve();
      }

      let tfvarValues = tfvars[variableName];
      if (!JitHelper._checkTerrahubVariableType(tfvarValues) == 'list') {
        return Promise.resolve();
      }
      
      tfvarValues.filter(elem => elem !== 'default').forEach(tfvarValue => {
        JitHelper._parsingParamInResource(template, tfvarValue, oldProviderTerrahubVariable, resourcesByType, resourceName);
        const { output } = template;

        if (output) {
          Object.keys(output).filter(outputName => output[outputName])
          .filter(elem => output[elem].value.includes(resourceName))
          .filter(elem => output[elem].value.includes(oldProviderTerrahubVariable))
          .map(outputName => {
              const outputByName = output[outputName];
              const regExOutput = /map\((.+?)\)/gm;
              const outputVariables = outputByName.value.match(regExOutput);

              if (outputVariables) {
                outputVariables.map(outputVariable => {
                  let outputMap = outputVariable.slice(4,-1).split(',');
                  outputMap.push(outputMap[0].replace(oldProviderTerrahubVariable, tfvarValue));
                  outputMap.push(outputMap[1].replace(`.${resourceName}.`, `.${resourceName}_${tfvarValue}.`));
                  output[outputName].value = output[outputName].value.replace(outputVariable, `map(${outputMap.join(',')})`);
                });
              }
            });
        }
      });
        
    });
  }

  /**
   * 
   * @param {*} template 
   * @param {*} tfvarValue 
   * @param {*} oldProviderTerrahubVariable 
   * @param {*} resourcesByType 
   * @param {*} resourceName 
   */
  static _parsingParamInResource(template, tfvarValue, oldProviderTerrahubVariable, resourcesByType, resourceName) {
    const resourceByName = resourcesByType[resourceName];
    let resourceByNameCopy = Object.assign({}, resourceByName);
    Object.keys(resourceByName).filter(paramName => resourceByName[paramName])
      .filter(elem => elem !== 'provider').map(paramName => {
    
      const paramByName = JSON.stringify(resourceByName[paramName]);
      const regExLocal = /local\.+[a-zA-Z0-9\-_]+(\}|\[|\.|\ |\)|\,)/gm;
      const localVariables = paramByName.match(regExLocal);

      if (localVariables) {
        let unique = [...new Set(localVariables)];
        unique.map(localVariable => {
          const localVariableName = localVariable.slice(0, -1).replace(/local\./, '');
          const { locals } = template;
          locals[`${localVariableName}_${tfvarValue}`] = locals[localVariableName].replace(oldProviderTerrahubVariable, tfvarValue);
          let resourceByNameStringify = JSON.stringify(resourceByNameCopy[paramName]);
          resourceByNameStringify = resourceByNameStringify.replace(localVariable.slice(0, -1), `local.${localVariableName}_${tfvarValue}`);
          resourceByNameCopy[paramName] = JSON.parse(resourceByNameStringify);
        });
      }

      const regExData = /data\.+[a-zA-Z0-9\-_]+\.+[a-zA-Z0-9\-_]+(\.)/gm;
      const dataVariables = paramByName.match(regExData);

      if (dataVariables) {
        let unique = [...new Set(dataVariables)];
        unique.map(dataVariable => {
          const dataPath = dataVariable.split('.');
          let resourceByNameStringify = JSON.stringify(resourceByNameCopy[paramName]);
          resourceByNameStringify = resourceByNameStringify.replace(
            dataVariable, dataVariable.replace(dataPath[2], `${dataPath[2]}_${tfvarValue}`));
          resourceByNameCopy[paramName] = JSON.parse(resourceByNameStringify);
        });
        
      }

      if (resourceByNameCopy.hasOwnProperty('provider')) {
        resourceByNameCopy['provider'] = resourceByName['provider']
          .replace(oldProviderTerrahubVariable, tfvarValue);
      }

      resourcesByType[`${resourceName}_${tfvarValue}`] = resourceByNameCopy;
    });
  }

  /**
   * Normalize Tfvars config
   * @param {Object} config
   * @return {String}
   * @private
   */
  static _normalizeTfvars(config) {
    const template = config['template'];

    return Promise.resolve().then(() => {
      let templateStringify = JSON.stringify(template);
      const templateStringifyArr = JitHelper._extractTerrahubVariables(templateStringify);
      if (templateStringifyArr) {
        templateStringifyArr.map(terrahubVariable => {
          const { variableName, variableNameNetArr } = JitHelper._extractTerrahubVariableName(terrahubVariable);
          const { tfvars } = template;
          const variableValue = (tfvars && tfvars.hasOwnProperty(variableName)) ?
            JitHelper._extractValueFronTfvar(tfvars[variableName], variableNameNetArr): '';
          templateStringify = templateStringify.replace(terrahubVariable, variableValue);
        });
      }
      config['template'] = JSON.parse(templateStringify); 

      return Promise.resolve();
    });
  }

  /**
   * 
   * @param {String} terrahubVariable  
   * @return {String, Array}
   * @private
   */
  static _extractTerrahubVariableName(terrahubVariable) {
    const variableNameNetArr = JitHelper._extractTerrahubVariableElements(terrahubVariable);
    const variableNameNet = variableNameNetArr[0];
    const variableName = variableNameNet.replace(/\\"/g, '');

    return { variableName, variableNameNetArr };
  }

  /**
   * 
   * @param {Object} terrahubVariable 
   * @return {Array}
   * @private
   */
  static _extractTerrahubVariableElements(terrahubVariable) {
    const regExTfvar = /\\"+[a-zA-Z0-9_\-\.]+\\"/gm;
    const variableNameNetArr = terrahubVariable.match(regExTfvar);

    return variableNameNetArr;
  }

  /**
   * 
   * @param {String} templateStringify 
   * @return {Array}
   * @private
   */
  static _extractTerrahubVariables(templateStringify) {
    const regExTfvars = /\$\{tfvar\.terrahub\[\\"+[a-zA-Z0-9_\-\.\[\]\\"]+\\"\]\}/gm;
    const templateStringifyArr = templateStringify.match(regExTfvars);

    return templateStringifyArr;
  }

  /**
   * @param {Object} tfvarValue
   * @param {Array} variableNameNetArr
   * @return {String}
   * @private
   */
  static _extractValueFronTfvar(tfvarValue, variableNameNetArr) {
    let variableValue = '';

    switch (JitHelper._checkTerrahubVariableType(tfvarValue)) {
      case "list":
          if (variableNameNetArr.length == 2) {
            const indexOfElement = variableNameNetArr[1].replace(/\\"/g, '');
            variableValue = tfvarValue[indexOfElement];
          } else {
            variableValue = tfvarValue.join('|');
          }
        break;
      case 'string':
        variableValue = tfvarValue;
        break;
    }

    return variableValue;
  }

  /**
   * 
   * @param {Object} tfvarValue
   * @return {String}
   * @private 
   */
  static _checkTerrahubVariableType(tfvarValue) {
    let type = 'string';
    if (Array.isArray(tfvarValue)) {
      type = 'list';
    }
    else if (typeof tfvarValue === 'object') {
      type = 'map';
    }
    return type;
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
    const regExBucket = new RegExp('((s3|gs):\/\/)(.+?)([^\/]+)', 'gm');
    const bucket = remoteTfvarsLink.match(regExBucket).shift().replace(/(s3|gs):\/\//g, '');
    const regExPrefix = new RegExp('(' + bucket + '\/)(.+?)$');
    const regExPrefixBucket = new RegExp('(' + bucket + '\/)', 'g');
    const prefix = remoteTfvarsLink.match(regExPrefix).shift().replace(regExPrefixBucket, '');

    const promise = (remoteTfvarsLink.substring(0, 2) === 'gs') ? 
      JitHelper.gsHelper.getObject(bucket, prefix).then(data => {
        return JitHelper._parsingTfvars(data.toString(), config);
      }):
      JitHelper.s3Helper.getObject(bucket, prefix).then(data => {
        return JitHelper._parsingTfvars(data.Body.toString(), config);
      });

    return promise;
  }

  /**
   * @param {Object} config
   * @param {String} localTfvarsLink
   * @return {Promise}
   */
  static _addLocalTfvars(config, localTfvarsLink) {
    const localTfvarsLinkPath = path.resolve(config.project.root, localTfvarsLink);

    if (fse.existsSync(localTfvarsLinkPath)) {
      return fse.readFile(localTfvarsLinkPath).then(content => {
        return JitHelper._parsingTfvars(content.toString(), config );
      });
    }
    
    return Promise.resolve();
  }

  /**
   * 
   * @param {String} remoteTfvars
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  static _parsingTfvars(remoteTfvars, config) {
    const { template } = config;
    const remoteTfvarsJson = hcltojson(remoteTfvars);
    const tmpPath = JitHelper.buildTmpPath(config);
    template['tfvars'] = config.template.tfvars || {};

    const promises = Object.keys(remoteTfvarsJson).filter(it => remoteTfvarsJson[it]).map(it => {
      if (!Array.isArray(remoteTfvarsJson[it]) && typeof remoteTfvarsJson[it] === 'object') {
        remoteTfvarsJson[it] = {};
      }
      let obj = {};
      obj[it] = remoteTfvarsJson[it];
      template['tfvars'] = JSON.parse((JSON.stringify(template['tfvars']) +
        JSON.stringify(obj)).replace(/}{/g, ",").replace(/{,/g, "{"));
    });

    return Promise.all(promises)
      .then(() => {
        return fse.writeFileSync(path.join(tmpPath, 'config.tfvars'), remoteTfvars);
      });
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
   * @return {Array}
   * @private
   */
  static _extractOnlyLocalTfvarsLinks(config) {
    const { terraform: { varFile } } = config;
    const regEx = /(s3|gs):\/\/.+.tfvars/gm;

    return varFile.filter(src => !regEx.test(src));
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
    const tmpPath = homePath(jitPath, `${config.name}_${config.project.code}`);

    if (!fse.existsSync(tmpPath)) {
      fse.mkdirSync(tmpPath);
    }

    return tmpPath;
  }
}

module.exports = JitHelper;
