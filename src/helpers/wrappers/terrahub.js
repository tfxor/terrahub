'use strict';

const { STS } = require('aws-sdk');
const semver = require('semver');
const logger = require('../logger');
const Dictionary = require('../dictionary');
const BuildHelper = require('../build-helper');
const AbstractTerrahub = require('./abstract-terrahub');
const TerraformParser = require('../tfxor-terraform-parsers/terraform-parsers');

class Terrahub extends AbstractTerrahub {
  /**
   * @param {Object} data
   * @param {Error|String} err
   * @return {Promise}
   * @private
   * @override
   */
  async on(data, err = null) {
    let error = null;

    let realtimePayload = {
      runId: this._runId,
      status: data.status,
      action: this._action,
      projectName: this._project.name,
      projectId: this._project.code.toString(),
      componentName: this._config.name,
      componentHash: this._componentHash,
      realtimeCreatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      providerAccount: 'n/a'
    };

    try {
      const sts = new STS();
      const { Account: account} = await sts.getCallerIdentity({}).promise();
      realtimePayload.providerAccount = account;
    } catch (error) {
      logger.error(error);
    }

    if (this._action === 'init' && data.status === Dictionary.REALTIME.START && this.parameters.config.token) {
      await this.createComponent();
    }

    if (err) {
      error = err instanceof Error ? err : new Error(err || 'Unknown error');
      realtimePayload.error = JSON.stringify(error.message);
    }
    if (realtimePayload.action === 'plan' && data.status === Dictionary.REALTIME.SUCCESS) {
      realtimePayload.metadata = JSON.stringify(data.metadata);
    }

    if (this.parameters.config.token) {
      await this.parameters.fetch.post('realtime/create', { body: JSON.stringify(realtimePayload) });
    }

    return realtimePayload.hasOwnProperty('error') ? Promise.reject(error) : Promise.resolve(data);
  }

  /**
   * @return {Promise}
   * @protected
   * @override
   */
  checkProject() {
    if (!this.parameters.config.token) {
      return Promise.resolve();
    }

    const payload = {
      name: this._project.name,
      hash: this._project.code.toString()
    };
    return this.parameters.fetch.post('project/create', { body: JSON.stringify(payload) }).then((json) => {
      this._project.id = json.data.id;

      return Promise.resolve();
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  createComponent() {
    const componentPayload = {
      projectName: this._project.name,
      projectId: this._project.code.toString(),
      runId: this._runId,
      name: this._config.name,
      hash: this._componentHash,
      componentStartedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    return this.parameters.fetch.post('component/create', { body: JSON.stringify(componentPayload) });
  }

  /**
   * @param {Object} data
   * @return {Promise}
   * @private
   * @abstract
   */
  async upload(data) {
    if (
      !this.parameters.config.token ||
      !data ||
      !data.buffer ||
      !['plan', 'apply', 'destroy'].includes(this._action)
    ) {
      return data;
    }

    const terraformVersion = this._config.terraform.version;

    let parseResult = {};
    if (semver.satisfies(terraformVersion, '>=0.12.0')) {
      if (this._action === 'plan') {
        const planAsJson = await this._terraform.show(this._terraform._metadata.getPlanPath());
        parseResult = (new TerraformParser(this._action, planAsJson.toString(), true)).parse();
      } else {
        parseResult = (new TerraformParser(this._action, data.buffer.toString(), true)).parse();
      }

      parseResult.componentName = this._config.name;
      parseResult.componentHash = this._componentHash;
      await this._callParseLambda(parseResult);
      return data;
    }

    const terraformParser = new TerraformParser(this._action, data.buffer.toString(), false);
    parseResult = terraformParser.parse();
    parseResult.componentName = this._config.name;
    parseResult.componentHash = this._componentHash;
    await this._callParseLambda(parseResult);

    return data;
  }

  /**
   * @param {Object} parseResult
   * @param {Boolean} isHcl2
   * @return {Promise}
   * @private
   */
  _callParseLambda(parseResult) {
    const url = `resource/parse-${this._action}`;

    const re = /\\\\"/gm;
    const options = {
      body: JSON.stringify({
        parseResult: parseResult,
        projectId: this._project.id,
        thubRunId: this._runId
      }).replace(re, '\\\"')
    };
    const promise = this.parameters.fetch.post(url, options).catch((error) => {
      const message = this._addNameToMessage('Failed to trigger parse function');

      logger.error({ ...error, message });

      return Promise.resolve();
    });

    return process.env.DEBUG ? promise : Promise.resolve();
  }

  /**
   * @param {Object} config
   * @param {String} thubRunId
   * @param {String[]} actions
   * @return {Function[]}
   */
  getTasks({ config, thubRunId, actions } = {}) {
    const { distributor } = config;

    logger.updateContext({
      runId: thubRunId,
      componentName: config.name
    });

    return actions.map((action) => (options) => {
      logger.updateContext({ action: action });

      return action !== 'build'
        ? this.getTask(action, options)
        : BuildHelper.getComponentBuildTask(config, distributor);
    });
  }
}

module.exports = Terrahub;
