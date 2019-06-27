'use strict';

const Dictionary = require('./dictionary');
const { fetch, config: { api } } = require('../parameters');

class ApiHelper {

  constructor() {
    this._promises = [];
    this._logs = [];
  }

  /**
   * @return {Array}
   */
  get promises() {
    return this._promises;
  }

  /**
   * @return Object[]
   */
  retrievePromises() {
    const _promises = [...this._promises, ...this._logs];
    this._promises = [];
    this._logs = [];

    return _promises;
  }

  /**
   * @param {Object} promise
   */
  pushToPromises(promise) {
    this._promises.push(promise);
  }

  /**
   * @param data {{ messages: Object, context: Object }}
   */
  sendLogsToApi(data) {
    const message = Object.keys(data.messages).map(key => data.messages[key]).join('');
    const url = `https://${api}.terrahub.io/v1/elasticsearch/document/create/${this.runId}?indexMapping=logs`;
    const body = {
      bulk: [{
        terraformRunId: this.runId,
        timestamp: Date.now(),
        component: data.context.componentName,
        log: message,
        action: data.context.action
      }]
    };

    // if (this._logs.length < 5) {
    //   this._logs.push({
    //     terraformRunId: this.runId,
    //     timestamp: Date.now(),
    //     component: data.context.componentName,
    //     log: message,
    //     action: data.context.action
    //   });
    // } else {
    //   this._promises.concat(this._logs);
    //   this._logs = [];
    // }

    this.pushToPromises({ url, body });
  }

  /**
   * @param {String} status
   * @param {String} runId
   * @param {String} commandName
   * @param {Object} project
   * @param {String} environment
   */
  sendMainWorkflow({ status, runId, commandName, project, environment }) {
    if (status === 'create') {
      this.runId = runId;
      this.commandName = commandName;
      this.projectHash = project.code;
      this.projectName = project.name;
      this.environment = environment;
    }

    if (ApiHelper.canApiLogsBeSent && this._isWorkflowUseCase()) {
      this.sendDataToApi({ source: 'workflow', status });
    }
  }

  /**
   * @param {String} status
   * @param {String} [name]
   * @param {String} [action]
   * @param {String} [hash]
   * @param {String[]} [actions]
   */
  sendComponentFlow({ status, name, action, hash, actions }) {
    if (!this.actions && actions) {
      this.actions = actions;
    }

    if (ApiHelper.canApiLogsBeSent && this._isComponentUseCase(status, action, actions)) {
      this.sendDataToApi({ source: 'component', status, hash, name });
    }
  }

  /**
   * @param {String} status
   * @param {String} action
   * @param {Array} actions
   * @return {Boolean}
   */
  _isComponentUseCase(status, action, actions) {
    if (status === 'create') {
      const _firstAction = actions[0] === 'prepare' ? actions[1] : actions[0];

      return _firstAction === action && _firstAction !== 'plan';
    } else if (status === 'update') {
      const _finalAction = actions.pop();

      return action === _finalAction;
    }

    return false;
  }

  /**
   * @param {String} source
   * @param {String} status
   * @param {String} [hash]
   * @param {String} [name]
   */
  sendDataToApi({ source, status, hash, name }) {
    const url = this.getUrl(source, status);
    const body = this.getBody(source, status, hash, name);

    this.pushToPromises({ url, body });
  }

  /**
   * @return {Boolean}
   * @private
   */
  _isWorkflowUseCase() {
    return ['apply', 'build', 'destroy', 'init', 'plan', 'run', 'workspace'].includes(this.commandName);
  }

  /**
   * @param {String} source
   * @param {String} status
   * @return {string}
   */
  getUrl(source, status) {
    return `thub/${source === 'workflow' ? 'terraform-run' : 'terrahub-component'}/${status}`;
  }

  /**
   * @param {String} source
   * @param {String} status
   * @param {String} hash
   * @param {String} name
   * @return {Object} body
   */
  getBody(source, status, hash, name) {
    if (source === 'workflow') {
      return this._composeWorkflowBody(status);
    } else if (source === 'component') {
      return this._composeComponentBody(status, hash, name);
    }
  }

  /**
   * @param {String} status
   * @param {String} hash
   * @param {String} name
   * @return {Object} body
   * @private
   */
  _composeComponentBody(status, hash, name) {
    const time = status === 'create' ? 'terrahubComponentStarted' : 'terrahubComponentFinished';

    return {
      'terraformHash': hash,
      'terraformName': name,
      'terraformRunUuid': this.runId,
      [time]: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
  }

  /**
   *
   * @param {String} status
   * @return {Object} body
   * @private
   */
  _composeWorkflowBody(status) {
    const time = status === 'create' ? 'terraformRunStarted' : 'terraformRunFinished';

    return {
      'terraformRunId': this.runId,
      [time]: new Date().toISOString().slice(0, 19).replace('T', ' '),
      projectHash: this.projectHash,
      projectName: this.projectName,
      'terraformRunStatus': status === 'start' ? Dictionary.REALTIME.START : Dictionary.REALTIME.SUCCESS,
      'terraformRunWorkspace': this.environment || 'default',
    };
  }

  /**
   * @return {Boolean}
   */
  static canApiLogsBeSent() {
    return process.env.THUB_TOKEN_IS_VALID;
  }

  /**
   * @param {Object[]} promises
   * @return {Promise}
   */
  fetchRequests(promises) {
    const _promises = promises.map(({ url, body }) => {
      return fetch.post(url, {
        body: JSON.stringify(body)
      }).catch(err => console.log(err));
    });

    return Promise.all(_promises);
  }


  /**
   * @return {Promise}
   */
  sendLogToS3() {
    if (ApiHelper.canApiLogsBeSent) {
      return fetch.post(`https://${api}.terrahub.io/v1/elasticsearch/logs/save/${this.runId}`)
        .catch(error => console.log(error));
    }
  }

  /**
   * On error sends finish status for all logging executions
   */
  sendErrorToApi() {
    if (ApiHelper.canApiLogsBeSent) {
      this.endComponentsLogging();
      this.sendMainWorkflow({ status: 'update' });
    }
  }

  /**
   * Finish components logging
   */
  endComponentsLogging() {
    const terrahubComponents = process.env.THUB_EXECUTION_LIST ? process.env.THUB_EXECUTION_LIST.split(',') : [];

    terrahubComponents.map(it => {
      const status = 'update',
        source = 'component',
        name = it.split(':')[0],
        hash = it.split(':')[1];

      this.sendDataToApi({ source, status, name, hash });
    });
  }
}

module.exports = new ApiHelper();