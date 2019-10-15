'use strict';

const fse = require('fs-extra');
const semver = require('semver');
const S3Helper = require('./s3-helper');
const GsHelper = require('./gs-helper');
const hcltojson = require('hcl-to-json');
const { resolve, join } = require('path');
const objectDepth = require('object-depth');
const { homePath, extend } = require('./util');
const { exec } = require('child-process-promise');
const Downloader = require('../helpers/downloader');
const { binPath, hclPath, tfstatePath } = require('../parameters');

class HclHelper {
  /**
   * HCL middleware (config to files)
   * @param {Object} config
   * @return {Promise}
   */
  static middleware(config) {
    const transformedConfig = HclHelper._transformConfig(config);

    if (!transformedConfig.isTemplate) {
      return Promise.resolve(config);
    }

    const { template } = transformedConfig;

    return Promise.resolve().then(() => HclHelper._moduleSourceRefactoring(template))
      .then(() => {
      // add "tfvars" if it is not described in config
      const localTfvarsLinks = HclHelper._extractOnlyLocalTfvarsLinks(config);
      if (localTfvarsLinks.length > 0) {
        return HclHelper._addLocalTfvars(config, localTfvarsLinks);
      }
    }).then(() => {
      // add "tfvars" if it is not described in config
      const remoteTfvarsLinks = HclHelper._extractOnlyRemoteTfvarsLinks(config);
      if (remoteTfvarsLinks.length > 0) {
        return HclHelper._addTfvars(config, remoteTfvarsLinks);
      }
    }).then(() => HclHelper._normalizeProvidersForResource(config))
      .then(() => HclHelper._normalizeProvidersForData(config))
      .then(() => HclHelper._normalizeTfvars(config))
      .then(() => HclHelper._createTerraformFiles(config))
      .then(() => {
        // generate "variable.tf" if it is not described in config
        if (template.hasOwnProperty('tfvars')) {
          return HclHelper._generateVariable(config);
        }
      })
      .then(() => HclHelper._symLinkNonTerraHubFiles(config))
      .then(() => config);
  }

  
  /**
   * Transform template config
   * @param {Object} config
   * @return {Object}
   * @private
   */
  static _transformConfig(config) {
    config.isTemplate = config.hasOwnProperty('template');

    if (config.isTemplate) {
      const componentPath = join(config.project.root, config.root);

      const localTfstatePath = HclHelper._normalizeBackendLocalPath(config);
      const remoteTfstatePath = HclHelper._normalizeBackendS3Key(config);

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
    let remoteTfstatePath = join('terraform', config.project.name);

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
          return HclHelper._parsingResourceByType(resourcesByType, template);
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
          return HclHelper._parsingResourceByType(resourcesByType, template);
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

        return HclHelper._parsingResourceByName(resourcesByType, resourceName, template);
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
      const providerTerrahubVariables = HclHelper._extractTerrahubVariables(
        JSON.stringify(resourceByName['provider'])
      );
      
      return providerTerrahubVariables;
    }).then(providerTerrahubVariables => {

      if (!providerTerrahubVariables) {
        return Promise.resolve();
      }
      const providerTerrahubVariable = providerTerrahubVariables[0];
      const { variableName } = HclHelper._extractTerrahubVariableName(
        providerTerrahubVariable
      );
      const oldProviderTerrahubVariable = providerTerrahubVariable.replace(/\\"/gm, '\"');        
      const { tfvars } = template;
      if (!tfvars && !tfvars.hasOwnProperty(variableName)) {
        return Promise.resolve();
      }

      let tfvarValues = tfvars[variableName];
      if (!HclHelper._checkTerrahubVariableType(tfvarValues) == 'list' || !tfvarValues) {
        return Promise.resolve();
      }
      
      return Promise.resolve().then(() => {
        tfvarValues.filter(elem => elem !== 'default').forEach(tfvarValue => {
          HclHelper._parsingParamInResource(
            template, tfvarValue, oldProviderTerrahubVariable,
            resourcesByType, resourceName).then(() => {
            const { output } = template;

            if (output) {
              const promisesOutput = Object.keys(output).filter(outputName => output[outputName])
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
              return Promise.all(promisesOutput);
            }

            return Promise.resolve();
          });
        });
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
    const promises = Object.keys(resourceByName).filter(paramName => resourceByName[paramName])
      .filter(elem => elem !== 'provider').map(paramName => {
      const paramByName = JSON.stringify(resourceByName[paramName]);
      return Promise.resolve().then(() => {
        const regExLocal = /local\.+[a-zA-Z0-9\-_]+(\}|\[|\.|\ |\)|\,)/gm;
        const localVariables = paramByName.match(regExLocal);

        if (localVariables) {
          let unique = [...new Set(localVariables)];
          const promises = unique.map(localVariable => {
            const localVariableName = localVariable.slice(0, -1).replace(/local\./, '');
            const { locals } = template;
            locals[`${localVariableName}_${tfvarValue}`] = locals[localVariableName].replace(oldProviderTerrahubVariable, tfvarValue);
            let resourceByNameStringify = JSON.stringify(resourceByNameCopy[paramName]);
            resourceByNameStringify = resourceByNameStringify.replace(new RegExp(localVariable.slice(0, -1), 'g'), `local.${localVariableName}_${tfvarValue}`);
            resourceByNameCopy[paramName] = JSON.parse(resourceByNameStringify);
          });

          return Promise.all(promises);
        }

        return Promise.resolve();
      }).then(() => {
        const regExData = /data\.+[a-zA-Z0-9\-_]+\.+[a-zA-Z0-9\-_]+(\.)/gm;
        const dataVariables = paramByName.match(regExData);

        if (dataVariables) {
          let unique = [...new Set(dataVariables)];
          const promises = unique.map(dataVariable => {
            const dataPath = dataVariable.split('.');
            let resourceByNameStringify = JSON.stringify(resourceByNameCopy[paramName]);
            resourceByNameStringify = resourceByNameStringify.replace(
              dataVariable, dataVariable.replace(dataPath[2], `${dataPath[2]}_${tfvarValue}`));
            resourceByNameCopy[paramName] = JSON.parse(resourceByNameStringify);
          });
          
          return Promise.all(promises);
        }

        return Promise.resolve();
      }).then(() => {
        if (resourceByNameCopy.hasOwnProperty('provider')) {
          resourceByNameCopy['provider'] = resourceByName['provider']
            .replace(oldProviderTerrahubVariable, tfvarValue);
        }
        
        let resourceByNameCopyStringify = JSON.stringify(resourceByNameCopy);
        const searchValue = JSON.stringify(oldProviderTerrahubVariable);
        resourceByNameCopyStringify = resourceByNameCopyStringify.replace(
          searchValue.substring(1, searchValue.length - 1), tfvarValue
        );
        resourcesByType[`${resourceName}_${tfvarValue}`] = JSON.parse(resourceByNameCopyStringify);
        return Promise.resolve();
      });
    });

    return Promise.all(promises);
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
      const templateStringifyArr = HclHelper._extractTerrahubVariables(templateStringify);
      if (templateStringifyArr) {
        templateStringifyArr.map(terrahubVariable => {
          const { variableName, variableNameNetArr } = HclHelper._extractTerrahubVariableName(terrahubVariable);
          const { tfvars, locals } = template;
          const variableValue = (tfvars && tfvars.hasOwnProperty(variableName))
            ? HclHelper._extractValueFromTfvar(tfvars[variableName], variableNameNetArr)
            : (locals && locals.hasOwnProperty(variableName))
              ? HclHelper._extractValueFromTfvar(locals[variableName], variableNameNetArr) : '';
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
    const variableNameNetArr = HclHelper._extractTerrahubVariableElements(terrahubVariable);
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
  static _extractValueFromTfvar(tfvarValue, variableNameNetArr) {
    let variableValue = '';

    switch (HclHelper._checkTerrahubVariableType(tfvarValue)) {
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
      case 'map':
        const keyOfElement = variableNameNetArr[1].replace(/\\"/g, '');
        variableValue = tfvarValue[keyOfElement];
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
          module[it].source = resolve(template.locals.component.path, source);
        }
      });
      
      return Promise.all(promises);
    } 

    return Promise.resolve();
  }

  /**
   * @param {Object} config
   * @param {Array} remoteTfvarsLinks
   * @return {Promise}
   */
  static _addTfvars(config, remoteTfvarsLinks) {
    const promises = Object.keys(remoteTfvarsLinks).map(it => {
      const remoteTfvarsLink = remoteTfvarsLinks[it].replace(/'/g, '');
      const regExBucket = new RegExp('((s3|gs):\/\/)(.+?)([^\/]+)', 'gm');
      const bucket = remoteTfvarsLink.match(regExBucket).shift().replace(/(s3|gs):\/\//g, '');
      const regExPrefix = new RegExp('(' + bucket + '\/)(.+?)$');
      const regExPrefixBucket = new RegExp('(' + bucket + '\/)', 'g');
      const prefix = remoteTfvarsLink.match(regExPrefix).shift().replace(regExPrefixBucket, '');

      const promise = (remoteTfvarsLink.substring(0, 2) === 'gs') ?
        HclHelper.gsHelper.getObject(bucket, prefix).then(data => {
          return HclHelper._parsingTfvars(data.toString(), config);
        }):
        HclHelper.s3Helper.getObject(bucket, prefix, config).then(data => {
          return HclHelper._parsingTfvars(data.Body.toString(), config);
        });

      return promise;
    });

    return Promise.all(promises);
  }

  /**
   * @param {Object} config
   * @param {Array} localTfvarsLinks
   * @return {Promise}
   */
  static _addLocalTfvars(config, localTfvarsLinks) {
    const promises = Object.keys(localTfvarsLinks).map(it => {
      const localTfvarsLinkPath = resolve(config.project.root, config.root, localTfvarsLinks[it]);
      if (fse.existsSync(localTfvarsLinkPath)) {
        return fse.readFile(localTfvarsLinkPath).then(content => {
          return HclHelper._parsingTfvars(content.toString(), config);
        });
      }
    });
    
    return Promise.all(promises);
  }

  /**
   * 
   * @param {String} remoteTfvars
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  static _parsingTfvars(remoteTfvars, config) {
    const regex = /\<\<EOT[^\=]+EOT/gms;
    let m;
    let newRemoteTfvars = remoteTfvars;
    while ((m = regex.exec(remoteTfvars)) !== null) {
        if (m.index === regex.lastIndex) { regex.lastIndex++; }
        m.forEach((match) => {
            let newValue = match.replace(/\<\<EOT/g, "").replace(/EOT/g, "").replace(/\n/g, "");
            newValue = newValue.replace(/\r/g, "").replace(/  /g, "");
            newRemoteTfvars = newRemoteTfvars.replace(match, JSON.stringify(newValue));
        });
    }

    const { template } = config;
    const remoteTfvarsJson = hcltojson(newRemoteTfvars);

    template['tfvars'] = JSON.parse((JSON.stringify(config.template.tfvars || {}) +
    JSON.stringify(remoteTfvarsJson)).replace(/}{/g, ",").replace(/{,/g, "{"));
  
    return Promise.resolve();  
  }

  /**
   * @param {Object} config
   * @return {Array}
   * @private
   */
  static _extractOnlyRemoteTfvarsLinks(config) {
    const { terraform: { varFile } } = config;
    const regEx = /(s3|gs):\/\/.+.tfvars/gm;

    return varFile.filter(src => src.match(regEx));
  }

  /**
   * @param {Object} config
   * @return {Array}
   * @private
   */
  static _extractOnlyLocalTfvarsLinks(config) {
    const { terraform: { varFile } } = config;
    const regEx = /(s3|gs):\/\/.+.tfvars/gm;

    return varFile.filter(src => !src.match(regEx));
  }

  /**
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  static _createTerraformFiles(config) {
    const { template, cfgEnv } = config;
    const tmpPath = HclHelper.buildTmpPath(config);

    const promises = Object.keys(template).filter(it => template[it]).map(it => {
      let name = `${it}.tf`;
      let data = { [it]: template[it] };

      switch (it) {
        case 'resource':
          name = 'main.tf';
          break;
        case 'tfvars':
          name = join(cfgEnv === 'default' ? '' : 'workspace', `${cfgEnv}.tfvars`);
          data = template[it];
          break;
      }

      return HclHelper.convertJsonToHcl(join(tmpPath, name), data, HclHelper.checkTfVersion(config));
    });

    return Promise.all(promises);
  }

  /**
   * @param {Object} config
   * @private
   */
  static _generateVariable(config) {
    const variable = config.template.variable || {};    
    const tmpPath = HclHelper.buildTmpPath(config);
    const { tfvars } = config.template;
    Object.keys(tfvars).filter(elem => !Object.keys(variable).includes(elem)).forEach(it => {      
      let type = 'string';
      if (Array.isArray(tfvars[it])) {
        type = 'list';
      } else if (typeof tfvars[it] === 'object' && HclHelper.checkTfVersion(config)) {
        for (let index = 0; index < objectDepth(tfvars[it]); index++) {
          type = `map(${type})`;          
        }
      } else if (typeof tfvars[it] === 'object') {
        type = 'map';
      }

      variable[it] = { type };
    });
    return HclHelper.convertJsonToHcl(join(tmpPath, 'variable.tf'), { variable }, HclHelper.checkTfVersion(config));
  }

  static _symLinkNonTerraHubFiles(config) {
    const regEx = /\.terrahub.*(json|yml|yaml)$/;
    const tmpPath = HclHelper.buildTmpPath(config);
    const src = join(config.project.root, config.root);

    return fse.ensureDir(tmpPath)
      .then(() => fse.readdir(src))
      .then(files => {
        const nonTerrahubFiles = files.filter(src => !src.match(regEx));
        const promises = nonTerrahubFiles.map(file =>
          fse.ensureSymlink(join(src, file), join(tmpPath, file)).catch(() => {})
        );

        return Promise.all(promises);
      })
      .catch(err => { throw new Error(err.toString()); });
  }

  /**
   * @return {S3Helper}
   * @private
   */
  static get s3Helper() {
    if (!HclHelper._s3Helper) {
      HclHelper._s3Helper = new S3Helper();
    }

    return HclHelper._s3Helper;
  }

  /**
   * @return {GsHelper}
   * @private
   */
  static get gsHelper() {
    if (!HclHelper._gsHelper) {
      HclHelper._gsHelper = new GsHelper();
    }

    return HclHelper._gsHelper;
  }

  /**
   * @param {Object} config
   * @return {String}
   */
  static buildTmpPath(config) {
    const tmpPath = homePath(hclPath, `${config.name}_${config.project.code}`);
    fse.ensureDirSync(tmpPath);

    return tmpPath;
  }

  /**
   * @param {String} componentPath
   * @param {Object} data
   * @param {Boolean} isHCL2
   * @return {Promise}
   */
  static convertJsonToHcl(componentPath, data, isHCL2) {
    const formatHCL1 = isHCL2 ? '' : '-F no';
    const arch = Downloader.getOsArch();
    const componentBinPath = join(binPath, arch);
    const extension = arch.indexOf('windows') > -1 ? '.exe' : '';
    const dataStringify = JSON.stringify(data);
    const buff = new Buffer(dataStringify);
    const base64data = buff.toString('base64');

    return exec(`${join(componentBinPath, `converter${extension}`)} -i '${base64data}' ${formatHCL1}`)
      .then(result => { return fse.outputFileSync(componentPath, result.stdout); })
      .catch(err => { return Promise.reject(err); });
  }

  /**
   * @param {Object} config
   * @return {Boolean}
   */
  static checkTfVersion(config) {    
    const { terraform } = config;
    if (terraform) {
      const { version } = terraform;
      if (version && semver.satisfies(version, '<0.12.0')) {
        return false;
      }
    }

    return true;
  }
}

module.exports = HclHelper;
