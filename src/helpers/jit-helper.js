'use strict';

const fse = require('fs-extra');
const semver = require('semver');
const hcltojson = require('hcl-to-json');
const { resolve, join } = require('path');
const { exec } = require('child-process-promise');
const objectDepth = require('object-depth');
const GsHelper = require('./gs-helper');
const S3Helper = require('./s3-helper');
const HelpParser = require('./help-parser');
const { DISTRIBUTOR } = require('./dictionary');
const Downloader = require('../helpers/downloader');
const { homePath, extend, homePathLambda } = require('./util');


class JitHelper {
  /**
   * JIT middleware (config to files)
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise}
   */
  static jitMiddleware(config, parameters) {
    const transformedConfig = JitHelper._transformConfig(config, parameters);

    if (!transformedConfig.isJit) {
      return Promise.resolve(config);
    }

    const { template } = transformedConfig;

    return Promise.resolve().then(() => JitHelper._moduleSourceRefactoring(template))
      .then(() => {
        // add "tfvars" if it is not described in config
        const localTfvarsLinks = JitHelper._extractOnlyLocalTfvarsLinks(config);
        if (localTfvarsLinks.length > 0) {
          return JitHelper._addLocalTfvars(config, localTfvarsLinks);
        }
      }).then(() => {
        // add "tfvars" if it is not described in config
        const remoteTfvarsLinks = JitHelper._extractOnlyRemoteTfvarsLinks(config);
        if (remoteTfvarsLinks.length > 0) {
          return JitHelper._addTfvars(config, remoteTfvarsLinks, parameters);
        }
      })
      .then(() => JitHelper._normalizeProvidersForResource(config))
      .then(() => JitHelper._normalizeProvidersForData(config))
      .then(() => JitHelper._normalizeTfvars(config))
      .then(() => JitHelper._createTerraformFiles(config, parameters))
      .then(() => {
        // generate "variable.tf" if it is not described in config
        if (template.hasOwnProperty('tfvars')) {
          return JitHelper._generateVariable(config, parameters);
        }
      })
      .then(() => {
        return HelpParser.Distributor !== DISTRIBUTOR.LOCAL
          ? Promise.resolve() : JitHelper._symLinkNonTerraHubFiles(config, parameters);
      })
      .then(() => config);
  }


  /**
   * Transform template config
   * @param {Object} config
   * @param {Object} parameters
   * @return {Object}
   * @private
   */
  static _transformConfig(config, parameters) {
    config.isJit = config.hasOwnProperty('template');

    if (config.isJit) {
      const componentPath = join(config.project.root, config.root);

      const localTfstatePath = JitHelper._normalizeBackendLocalPath(config, parameters);
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
   * @param {Object} parameters
   * @return {String}
   * @private
   */
  static _normalizeBackendLocalPath(config, parameters) {
    const { template } = config;
    const { locals } = template;
    let localTfstatePath = homePath(parameters.tfstatePath, config.project.name);

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
   * @param {Object} resourcesByType
   * @param {Object} template
   * @return {Promise}
   * @private
   */
  static _parsingResourceByType(resourcesByType, template) {
    const promises = Object.keys(resourcesByType).filter(resourceName => resourcesByType[resourceName])
      .map(resourceName => {
        const resourceByName = resourcesByType[resourceName];
        if (!resourceByName.hasOwnProperty('provider')) {
          return Promise.resolve();
        }

        return JitHelper._parsingResourceByName(resourcesByType, resourceName, template);
      });

    return Promise.all(promises);
  }

  /**
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
      if (!JitHelper._checkTerrahubVariableType(tfvarValues) == 'list' || !tfvarValues) {
        return Promise.resolve();
      }

      return Promise.resolve().then(() => {
        tfvarValues.filter(elem => elem !== 'default').forEach(tfvarValue => {
          JitHelper._parsingParamInResource(
            template, tfvarValue, oldProviderTerrahubVariable,
            resourcesByType, resourceName
          ).then(() => {
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
                      let outputMap = outputVariable.slice(4, -1).split(',');
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
   * @param {*} template
   * @param {*} tfvarValue
   * @param {*} oldProviderTerrahubVariable
   * @param {*} resourcesByType
   * @param {*} resourceName
   */
  static _parsingParamInResource(template, tfvarValue, oldProviderTerrahubVariable, resourcesByType, resourceName) {
    const resourceByName = resourcesByType[resourceName];
    let resourceByNameCopy = { ...resourceByName};
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
              resourceByNameStringify = resourceByNameStringify.replace(localVariable.slice(0, -1), `local.${localVariableName}_${tfvarValue}`);
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
                dataVariable, dataVariable.replace(dataPath[2], `${dataPath[2]}_${tfvarValue}`)
              );
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
            searchValue.substring(1, searchValue.length - 1),
            tfvarValue
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
      const templateStringifyArr = JitHelper._extractTerrahubVariables(templateStringify);
      if (templateStringifyArr) {
        templateStringifyArr.map(terrahubVariable => {
          const { variableName, variableNameNetArr } = JitHelper._extractTerrahubVariableName(terrahubVariable);
          const { tfvars, locals } = template;
          const variableValue = (tfvars && tfvars.hasOwnProperty(variableName))
            ? JitHelper._extractValueFromTfvar(tfvars[variableName], variableNameNetArr)
            : (locals && locals.hasOwnProperty(variableName))
              ? JitHelper._extractValueFromTfvar(locals[variableName], variableNameNetArr) : '';
          templateStringify = templateStringify.replace(terrahubVariable, variableValue);
        });
      }
      config['template'] = JSON.parse(templateStringify);

      return Promise.resolve();
    });
  }

  /**
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

    switch (JitHelper._checkTerrahubVariableType(tfvarValue)) {
      case 'list':
        if (variableNameNetArr.length === 2) {
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
   * @param {Object} tfvarValue
   * @return {String}
   * @private
   */
  static _checkTerrahubVariableType(tfvarValue) {
    let type = 'string';
    if (Array.isArray(tfvarValue)) {
      type = 'list';
    } else if (typeof tfvarValue === 'object') {
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
   * @param {Object} parameters
   * @return {Promise}
   */
  static _addTfvars(config, remoteTfvarsLinks, parameters) {
    const promises = Object.keys(remoteTfvarsLinks).map(it => {
      const remoteTfvarsLink = remoteTfvarsLinks[it].replace(/'/g, '');
      const regExBucket = new RegExp('((s3|gs):\/\/)(.+?)([^\/]+)', 'gm');
      const bucket = remoteTfvarsLink.match(regExBucket).shift().replace(/(s3|gs):\/\//g, '');
      const regExPrefix = new RegExp('(' + bucket + '\/)(.+?)$');
      const regExPrefixBucket = new RegExp('(' + bucket + '\/)', 'g');
      const prefix = remoteTfvarsLink.match(regExPrefix).shift().replace(regExPrefixBucket, '');

      const promise = (remoteTfvarsLink.substring(0, 2) === 'gs')
        ? JitHelper.gsHelper.getObject(bucket, prefix).then(data => {
          return JitHelper._parsingTfvars(data.toString(), config);
        })
        : JitHelper.s3Helper.getObject(bucket, prefix, config, parameters).then(data => {
          return JitHelper._parsingTfvars(data.Body.toString(), config);
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
          return JitHelper._parsingTfvars(content.toString(), config);
        });
      }
    });

    return Promise.all(promises);
  }

  /**
   * @param {String} remoteTfvars
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  static _parsingTfvars(remoteTfvars, config) {
    const { template } = config;
    const remoteTfvarsJson = hcltojson(remoteTfvars);

    template['tfvars'] = JSON.parse((JSON.stringify(config.template.tfvars || {}) +
      JSON.stringify(remoteTfvarsJson)).replace(/}{/g, ',').replace(/{,/g, '{'));

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
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  static _createTerraformFiles(config, parameters) {
    const { template, cfgEnv } = config;
    const tmpPath = JitHelper.buildTmpPath(config, parameters);

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

      return JitHelper.convertJsonToHcl(join(tmpPath, name), data, JitHelper.checkTfVersion(config), parameters);
    });

    return Promise.all(promises);
  }

  /**
   * @param {Object} config
   * @param {Object} parameters
   * @private
   */
  static _generateVariable(config, parameters) {
    const variable = config.template.variable || {};

    const tmpPath = JitHelper.buildTmpPath(config, parameters);

    const { tfvars } = config.template;

    Object.keys(tfvars).forEach(it => {
      let type = 'string';

      if (Array.isArray(tfvars[it])) {
        type = 'list';
      } else if (typeof tfvars[it] === 'object' && JitHelper.checkTfVersion(config)) {
        for (let index = 0; index < objectDepth(tfvars[it]); index++) {
          type = `map(${type})`;
        }
      } else if (typeof tfvars[it] === 'object') {
        type = 'map';
      }

      variable[it] = { type };
    });
    return JitHelper.convertJsonToHcl(join(tmpPath, 'variable.tf'), { variable }, JitHelper.checkTfVersion(config), parameters);
  }

  /**
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  static _symLinkNonTerraHubFiles(config, parameters) {
    const regEx = /\.terrahub.*(json|yml|yaml)$/;
    const tmpPath = JitHelper.buildTmpPath(config, parameters);
    const src = join(config.project.root, config.root);

    return fse.ensureDir(tmpPath)
      .then(() => fse.readdir(src))
      .then(files => {
        const nonTerrahubFiles = files.filter(src => !regEx.test(src));

        const promises = nonTerrahubFiles.map(file => fse.ensureSymlink(join(src, file), join(tmpPath, file))
          .catch(() => {}));

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
   * @param {Object} parameters
   * @return {String}
   */
  static buildTmpPath(config, parameters) {
    const tmpPath = parameters.isCloud
      ? homePathLambda(parameters.jitPath, `${config.name}_${config.project.code}`)
      : homePath(parameters.jitPath, `${config.name}_${config.project.code}`);

    fse.ensureDirSync(tmpPath);

    return tmpPath;
  }

  /**
   * @param {String} componentPath
   * @param {Object} data
   * @param {Boolean} isHCL2
   * @param {Object} parameters
   * @return {Promise}
   */
  static convertJsonToHcl(componentPath, data, isHCL2, parameters) {
    const formatHCL1 = isHCL2 ? '' : '-F no';
    const arch = Downloader.getOsArch();
    const componentBinPath = parameters.isCloud ? join('/opt/nodejs/node_modules/lib-terrahub-cli/bin') : join(parameters.binPath, arch);
    const extension = arch.indexOf('windows') > -1 ? '.exe' : '';
    const dataStringify = JSON.stringify(data);
    const buff = new Buffer(dataStringify);
    const base64data = buff.toString('base64');

    return exec(`${join(componentBinPath, `converter${extension}`)} -i '${base64data}' ${formatHCL1}`)
      .then(result => {
        return fse.outputFileSync(componentPath, result.stdout);
      }).catch(err => {
        return Promise.reject(err);
      });
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

module.exports = JitHelper;
