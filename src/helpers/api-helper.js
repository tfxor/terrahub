'use strict';

const events = require('events');
const Dictionary = require('./dictionary');
const { fetch, config: { api } } = require('../parameters');

class ApiHelper extends events.EventEmitter {

  constructor() {
    super();
    this._promises = [];
    this._logs = [];
    this._logs = [];
    this._workerIsFree = true;
    this.apiLogginStart = false;
  }

  /**
   * Sends event to ThreadDistributor to execute logging
   */
  sendToWorker() {
    if (this.isWorkForLogger() && this.loggerIsFree) {
      const counter = this.listenerCount('loggerWork', this);

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
    return this.isFinalRequest || this._promises.length || this._logs.length > 15;
  }

  /**
   * @return {Array}
   */
  get promises() {
    if (!this.apiLogginStart) {
      return [];
    }

    return [...this._promises, this.retrieveLogs(true)].map(({ url, body }) => {
      return fetch.post(url, {
        body: JSON.stringify(body)
      }).catch(err => console.log(err));
    });

  }

  /**
   * @return {Promise[]}
   */
  retrievePromises() {
    const _logs = this._logs.length ? this.retrieveLogs() : [];
    const _promises = this._promises.concat(_logs);

    this._promises = [];

    return _promises;
  }

  /**
   * @param {Boolean} all
   * @return {{ body: {bulk: Object[]}, url: String }}
   */
  retrieveLogs(all = false) {
    const url = `https://${api}.terrahub.io/v1/elasticsearch/document/create/${this.runId}?indexMapping=logs`;
    let _logs = [];

    if (!all) {
      _logs = this._logs.splice(0, 10);
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
   * @param {{ url: String, body: Object }}
   * @return {*}
   */
  fetchAsync({ url, body }) {
    return this.pushToPromises(fetch.post(url, {
      body: JSON.stringify(body)
    }).catch(err => console.log(err)));
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

    if (ApiHelper.canApiLogsBeSent && this._isWorkflowUseCase()) {
      if (status === 'create') {
        this.apiLogginStart = true;
      }

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

    // return this.fetchAsync({ url, body });
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
  static canApiLogsBeSent() {
    return process.env.THUB_TOKEN_IS_VALID;
  }

  /**
   * @return {Promise}
   */
  sendLogToS3() {
    if (ApiHelper.canApiLogsBeSent && this.apiLogginStart) {
      return fetch.post(`https://${api}.terrahub.io/v1/elasticsearch/logs/save/${this.runId}`)
        .catch(error => console.log(error));
    }
  }

  /**
   * On error sends finish status for all logging executions
   */
  sendErrorToApi() {
    if (ApiHelper.canApiLogsBeSent && this.apiLogginStart) {
      const runStatus = Dictionary.REALTIME.ERROR;
      this.endComponentsLogging();
      this.sendMainWorkflow({ status: 'update' }, runStatus);
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