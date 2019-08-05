'use strict';

const fse = require('fs-extra');
const events = require('events');
const { homePath } = require('./util');
const Dictionary = require('./dictionary');

class ApiHelper extends events.EventEmitter {

  constructor() {
    super();

    this._logs = [];
    this._promises = [];
    this._workerIsFree = true;
    this._tokenIsValid = false;
    this._apiLogginStart = false;
    this._logsRetrieveCount = 8;
    this._componentsExecutionList = {};
    this._errors = null;
  }

  /**
   * Initialize with parameters
   * @param {Object} parameters
   */
  init(parameters) { //todo Remove
    if (parameters) {
      this.fetch = parameters.fetch;
      this.config = parameters.config;
    }
  }
  /**
   * Sends event to ThreadDistributor to execute logging
   */
  sendToWorker() {
    if (this._errors) {
      return;
    }

    if (this.isWorkForLogger() && this.loggerIsFree) {
      const counter = this.listenerCount('loggerWork');

      if (counter < 2) {
        this.emit('loggerWork');
      } else {
        const eventListeners = this.listeners('loggerWork');
        const [mainListener, ...otherListeners] = eventListeners;

        otherListeners.forEach(it => this.removeListener('loggerWork', it));

        this.emit('loggerWork');
      }
    }
  }

  /**
   * @return {Boolean}
   */
  isWorkForLogger() {
    return this.isFinalRequest || this._promises.length || this._logs.length > this._logsRetrieveCount;
  }

  /**
   * Returns promises to terminate execution:
   *  1. `create` & `logs` promises
   *  2. `update` promises
   * @return {Promise}
   */
  promisesForSyncExit() {
    if (!this._apiLogginStart) {
      return Promise.resolve();
    }

    const _promises = [...this.retrievePromises(), this.retrieveLogs(true)]
      .filter(Boolean)
      .map(this.asyncFetch);

    return Promise.all(_promises).then(() => {
      const _promises = this.retrievePromises().map(this.asyncFetch);

      return Promise.all(_promises);
    });
  }

  /**
   * @param {{ url: {String}, body: {Object} }}
   * @return {Promise}
   */
  asyncFetch({ url, body }) {
    return this.fetch.post(url, {
      body: JSON.stringify(body)
    }).catch(err => console.log(err));
  }

  /**
   * @return {Promise[]}
   */
  retrieveDataToSend() {
    const _logs = this._logs.length ? this.retrieveLogs() : [];
    const _promises = this.retrievePromises().concat(_logs);

    this._promises = [];

    return _promises;
  }

  /**
   * From the begging returns `create` data then `update`
   * @return {Array}
   */
  retrievePromises() {
    const _promises = this._promises;
    const onCreate = _promises.filter(({ url }) => url.split('/')[2] === 'create');

    if (onCreate.length) {
      this._promises = _promises.filter(({ url }) => url.split('/')[2] !== 'create');

      return onCreate;
    } else {
      this._promises = [];

      return _promises;
    }
  }

  /**
   * @param {Boolean} all
   * @return {Boolean | { body: { bulk: Object[]}, url: String }}
   */
  retrieveLogs(all = false) {
    if (!this._logs.length) {
      return false;
    }

    const url = `https://${this.config.api}.terrahub.io/v1/elasticsearch/document/create/${this.runId}?indexMapping=logs`;
    let _logs = [];

    if (!all) {
      _logs = this._logs.splice(0, this._logsRetrieveCount);
    } else {
      _logs = this._logs;
      this._logs = [];
    }

    return {
      url,
      body: { bulk: [..._logs] }
    };
  }

  /**
   * @return {void}
   */
  setIsFree() {
    this._workerIsFree = true;
  }

  /**
   * @return {void}
   */
  setIsBusy() {
    this._workerIsFree = false;
  }

  /**
   * @return {Boolean}
   */
  get loggerIsFree() {
    return this._workerIsFree;
  }

  /**
   * @return {Boolean}
   */
  get isFinalRequest() {
    return this._promises.length && this._promises.find(({ url }) => url === 'thub/terraform-run/update');
  }

  /**
   * @param {Object} promise
   */
  pushToPromises(promise) {
    this._promises.push(promise);

    return this.sendToWorker();
  }

  /**
   * @param {Object} body
   * @return {void||null}
   */
  pushToLogs(body) {
    this._logs.push(body);

    return this.sendToWorker();
  }

  /**
   * @param data {{ messages: Object, context: Object }}
   */
  sendLogsToApi(data) {
    if (!this.logsTimestampAdder) {
      this.logsTimestampAdder = 0;
    }
    this.logsTimestampAdder++;

    const message = Object.keys(data.messages).map(key => data.messages[key]).join('');
    const body = {
      terraformRunId: this.runId,
      timestamp: Date.now() + this.logsTimestampAdder,
      component: data.context.componentName,
      log: message,
      action: data.context.action
    };

    this.pushToLogs(body);
  }

  /**
   * @param {{ status: String, [runId]: String, [commandName]: String, [project]: Object, [environment]: String}}
   * @param {Number} [runStatus]
   */
  sendMainWorkflow({ status, runId, commandName, project, environment }, runStatus) {
    if (status === 'create') {
      this.runId = runId;
      this.commandName = commandName;
      this.projectHash = project.code;
      this.projectName = project.name;
      this.environment = environment;
    }

    if (this.tokenIsValid && this._isWorkflowUseCase()) {
      if (status === 'create') {
        this._apiLogginStart = true;
      }

      this.sendDataToApi({ source: 'workflow', status }, runStatus);
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

    if (this.tokenIsValid && this._isComponentUseCase(status, action, actions)) {
      this.sendDataToApi({ source: 'component', status, hash, name });
    }
  }

  /**
   * @param {String} status
   * @param {String} action
   * @param {String[]} actions
   * @return {Boolean}
   */
  _isComponentUseCase(status, action, actions) {
    if (status === 'create') {
      const _firstAction = actions[0] === 'prepare' ? actions[1] : actions[0];

      return _firstAction === action && _firstAction !== 'plan';
    } else if (status === 'update') {
      const _finalAction = actions[actions.length - 1];

      return action === _finalAction;
    }

    return false;
  }

  /**
   * @param {{ source: String, status: String, [hash]: String, [name]: String }}
   * @param {Number} [runStatus]
   */
  sendDataToApi({ source, status, hash, name }, runStatus) {
    const url = this.getUrl(source, status);
    const body = this.getBody(source, status, hash, name, runStatus);

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
   * @param {Number} runStatus
   * @return {Object} body
   */
  getBody(source, status, hash, name, runStatus) {
    if (source === 'workflow') {
      return this._composeWorkflowBody(status, runStatus);
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

    if (status === 'create') {
      this._componentsExecutionList[hash] = name;
    }

    return {
      'terraformHash': hash,
      'terraformName': name,
      'terraformRunUuid': this.runId,
      [time]: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
  }

  /**
   * @param {String} status
   * @param {Number} runStatus
   * @return {Object} body
   * @private
   */
  _composeWorkflowBody(status, runStatus) {
    const time = status === 'create' ? 'terraformRunStarted' : 'terraformRunFinished';

    return {
      'terraformRunId': this.runId,
      [time]: new Date().toISOString().slice(0, 19).replace('T', ' '),
      projectHash: this.projectHash,
      projectName: this.projectName,
      'terraformRunStatus': this.getRunStatus(status, runStatus),
      'terraformRunWorkspace': this.environment || 'default'
    };
  }

  /**
   * @param {String} status
   * @param {Number} runStatus
   * @return {Number}
   */
  getRunStatus(status, runStatus) {
    if (runStatus) {
      return runStatus;
    }

    return status === 'start' ? Dictionary.REALTIME.START : Dictionary.REALTIME.SUCCESS;
  }

  /**
   * @return {Boolean}
   */
  canApiLogsBeSent() {
    return this.tokenIsValid && this.config.logs;
  }

  /**
   * @return {Boolean}
   */
  get tokenIsValid() {
    return this._tokenIsValid;
  }

  /**
   * @param {Boolean} token
   * @return {void}
   */
  setToken(token) {
    this._tokenIsValid = token;
  }

  /**
   * @return {Promise}
   */
  sendLogToS3() {
    if (this.canApiLogsBeSent() && this._apiLogginStart) {
      return this.fetch.post(`https://${this.config.api}.terrahub.io/v1/elasticsearch/logs/save/${this.runId}`)
        .catch(error => console.log(error));
    }
  }

  /**
   * On error sends finish status for all logging executions
   */
  sendErrorToApi() {
    if (this.tokenIsValid && this._apiLogginStart) {
      const runStatus = Dictionary.REALTIME.ERROR;
      this._errors = true;

      this.endComponentsLogging();
      this.sendMainWorkflow({ status: 'update' }, runStatus);
    }
  }

  /**
   * Finish components logging
   */
  endComponentsLogging() {
    Object.keys(this._componentsExecutionList).map(hash => {
      const status = 'update',
        source = 'component',
        name = this._componentsExecutionList[hash];

      this.sendDataToApi({ source, status, name, hash });
    });
  }

  /**
   * @return {Promise || Object}
   */
  async retrieveCloudAccounts() {
    if (!this._cloudAccounts) {
      const result = await this.fetch.get(`https://${this.config.api}.terrahub.io/v1/thub/cloud-account/retrieve`);
      this._cloudAccounts = result.data;
    }

    return this._cloudAccounts;
  }

  /**
   * @return {void}
   */
  deleteTempFolder() {
    const tmpPath = homePath('temp');

    fse.removeSync(tmpPath);
  }

}

module.exports = new ApiHelper();
