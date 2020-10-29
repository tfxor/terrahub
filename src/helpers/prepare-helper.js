'use strict';

const fs = require('fs');
const URL = require('url');
const fse = require('fs-extra');
const semver = require('semver');
const logger = require('./logger');
const Metadata = require('./metadata');
const Downloader = require('./downloader');
const Dictionary = require('./dictionary');
const { execSync } = require('child_process');
const { homePath, homePathLambda } = require('./util');

class PrepareHelper {
  /**
   * Perform terraform init & all required checks
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise}
   */
  static prepare(config, parameters) {
    logger.debug(JSON.stringify(config, null, 2));

    return PrepareHelper._checkTerraformBinary(config)
      .then(() => PrepareHelper._checkResourceDir(config, parameters))
      .then(() => PrepareHelper._fetchEnvironmentVariables(config, parameters))
      .then(() => ({ status: Dictionary.REALTIME.SUCCESS }))
      .catch((error) => {
        if (error.code && error.code === 'ETXTBSY') { return Promise.resolve(); }
        else { throw error; }
      });
  }

  /**
   * Ensure binary exists (download otherwise)
   * @param {Object} config
   * @return {Promise}
   */
  static _checkTerraformBinary(config) {
    try {
      const stat = fs.statSync(PrepareHelper.getBinary(config));

      if (stat !== null && stat.isFile()) {
        return Promise.resolve();
      }
    } catch (error) {
      switch (error.code) {
        case 'ENOENT':
          return (new Downloader()).download(PrepareHelper.getVersion(config), config.distributor);
        case 'ETXTBSY':
          return Promise.resolve();
        default:
          throw error;
      }
    }
  }

  /**
   * @param {Object} config
   * @return {String}
   */
  static getBinary(config) {
    return config.distributor === 'lambda'
      ? homePathLambda('terraform', PrepareHelper.getVersion(config), 'terraform')
      : homePath('terraform', PrepareHelper.getVersion(config), 'terraform');
  }

  /**
   * @param {Object} config
   * @return {String}
   */
  static getVersion(config) {
    if (!semver.valid(config.terraform.version)) {
      throw new Error(`Terraform version ${config.terraform.version} is invalid`);
    }

    return config.terraform.version;
  }

  /**
   * @param {Object} config
   * Check if workspaces supported
   * @returns {Boolean}
   * @private
   */
  static _checkWorkspaceSupport(config) {
    return semver.satisfies(PrepareHelper.getVersion(config), '>=0.9.0');
  }

  /**
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  static _checkResourceDir(config, parameters) {
    return fse.ensureDir(new Metadata(config, parameters).getRoot());
  }

  /**
   * Fetch environment variables from api
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise}
   */
  static _fetchEnvironmentVariables(config, parameters) {
    return PrepareHelper._getEnvVarsFromAPI(config, parameters).then(data => {
      return Object.assign(process.env, data);
    });
  }

  /**
   * Get Resources from TerraHub API
   * @param {Object} config
   * @param {Object} parameters
   * @return {Promise|*}
   */
  static _getEnvVarsFromAPI(config, parameters) {
    if (!parameters.config.token) {
      return Promise.resolve({});
    }
    try {
      const urlGet = execSync('git remote get-url origin', { cwd: config.project.root, stdio: 'pipe' });
      const data = Buffer.from(urlGet).toString('utf-8');
      const isUrl = !!URL.parse(data).host;
      // works for gitlab/github/bitbucket, add azure, google, amazon
      const urlData = /\/\/(?:.*@)?([^.]+).*?\/([^.]*)/;
      const sshData = /@([^.]*).*:(.*).*(?=\.)/;

      const [, provider, repo] = isUrl ? data.match(urlData) : data.match(sshData);
      if (repo && provider) {
        return parameters.fetch.get(`thub/variables/retrieve?repoName=${repo}&source=${provider}`).then(json => {
          if (Object.keys(json.data).length) {
            let test = JSON.parse(json.data.env_var);
            return Object.keys(test).reduce((acc, key) => {
              acc[key] = test[key].value;
              return acc;
            }, {});
          }
        }).catch(() => Promise.resolve({}));
      } else {
        return Promise.resolve({});
      }
    } catch (err) {
      return Promise.resolve({});
    }
  }
}

module.exports = PrepareHelper;
