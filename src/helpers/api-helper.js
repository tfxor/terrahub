'use strict';

const events = require('events');
const Fetch = require('./fetch');
const Dictionary = require('./dictionary');

class ApiHelper extends events.EventEmitter {
  constructor() {
    super();

    this._logs = [];
    this._promises = [];
    this._workerIsFree = true;
    this._tokenIsValid = false;
    this._apiLogginStart = false;
    this._logsDefaultRetrieveCount = 8;
    this._componentsExecutionList = {};
    this._errors = [];
  }

  /**
   * Initialize with parameters
   * @param {Object} parameters
   * @param {String} distributor
   */
  init(parameters, distributor = 'local') {
    this.fetch = parameters.fetch instanceof Fetch
      ? parameters.fetch : new Fetch(parameters.fetch.baseUrl, parameters.fetch.authorization);
    this.config = parameters.config;
    this.distributor = distributor;
  }

  /**
   * Sends event to Distributor to execute logging
   */
  sendToWorker() {
    if (this._errors.length) {
      return;
    }

    if (this.isWorkForLogger() && this.loggerIsFree) {
      const counter = this.listenerCount('loggerWork');

      if (counter < 3) {
        this.emit('loggerWork');
      } else {
        const eventListeners = this.listeners('loggerWork');
        // eslint-disable-next-line no-unused-vars
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
    return this.isFinalRequest || this._promises.length || this._logs.length > this._logsDefaultRetrieveCount;
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

    const _promises = [...this.retrievePromises(), this.retrieveLogs(true)].filter(Boolean);

    return Promise.all(this.asyncFetch(_promises)).then(() => {
      const _promises = this.retrievePromises();

      return Promise.all(this.asyncFetch(_promises));
    });
  }

  /**
   * @param {Array} promises
   * @param {String} promises.url
   * @param {Object} promises.body
   * @return {Promise[]}
   */
  asyncFetch(promises) {
    const _promises = Array.isArray(promises) ? promises : [promises];

    return _promises.map(({ url, body }) => this.fetch.post(url, { body: JSON.stringify(body) })
      .catch(err => this._errors.push(err)));
  }

  /**
   * @param {Boolean} all
   * @return {Promise[]}
   */
  retrieveDataToSend(all = false) {
    const _logs = this._logs && this._logs.length ? this.retrieveLogs(all) : [];
    const _promises = this.retrievePromises().concat(_logs);

    this._promises = [];

    return _promises;
  }

  /**
   * From the begging returns `create` data then `update`
   * @return {Array}
   */
  retrievePromises() {
    const { _promises } = this;
    const onCreate = _promises.filter(({ url }) => url.split('/')[2] === 'create');

    if (onCreate && onCreate.length) {
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
  retrieveLogs(all) {
    if (!this._logs.length) {
      return false;
    }

    const url = `https://${this.config.api}.terrahub.io/v1/thub/logs/create/${this.runId || process.env.THUB_RUN_ID}`;
    let _logs;

    if (!all) {
      _logs = this.logs;
    } else {
      ({_logs} = this);
      this._logs = [];
    }

    return { url, body: { bulk: [..._logs] } };
  }

  /**
   * @return {Object[]}
   */
  get logs() {
    const decimals = Math.floor(this._logs.length / 10);

    return this._logs.splice(0, decimals ? decimals * 10 : this._logsDefaultRetrieveCount);
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
    return this._promises.length && this._promises.find(({ url }) => url === 'thub/run/update');
  }

  /**
   * @param {Object} promise
   * @param {String} promise.url
   * @param {Object} promise.body
   * @return {Event} `LoggerWork`
   */
  pushToPromises(promise) {
    this._promises.push(promise);

    return this.sendToWorker();
  }

  /**
   * @param {Object} body
   * @return {void | null | Promise[]}
   */
  pushToLogs(body) {
    if (body.component === 'main' || body.log === '✅Done') {
      const promise = {
        url: `https://${this.config.api}.terrahub.io/v1/thub/logs/create/${this.runId || process.env.THUB_RUN_ID}`,
        body: { bulk: [body] }
      };

      return this.asyncFetch(promise);
    }
    this._logs.push(body);

    return this.sendToWorker();
  }

  /**
   * @param {Object} data { messages: Object, context: Object }
   */
  sendLogsToApi(data) {
    if (!this.logsTimestampAdder) {
      this.logsTimestampAdder = 0;
    }
    this.logsTimestampAdder++;

    const message = Object.keys(data.messages).map(key => data.messages[key]).join('');
    const body = {
      terraformRunId: this.runId || data.context.runId,
      timestamp: Date.now() + this.logsTimestampAdder,
      component: data.context.componentName,
      log: message,
      action: data.context.action,
      distributor: this.distributor
    };

    this.pushToLogs(body);
  }

  /**
   * @param {Object} {status: String, [runId]: String, [commandName]: String, [project]: Object, [environment]: String}
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
   * @param {String[]} [action]
   * @param {String} [hash]
   * @param {String[]} [actions]
   */
  sendComponentFlow({ status, name, action, hash, actions }) {
    if (!this.actions && actions) {
      this.actions = actions;
    }

    if (this.tokenIsValid && this._isComponentUseCase(status, action, actions)) {
      this.sendDataToApi({
        source: 'component',
        status,
        hash,
        name
      });
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
   * @param {Object} {source: String, status: String, [hash]: String, [name]: String}
   * @param {Number} [runStatus]
   * @return {Promise[] | Event}
   */
  sendDataToApi({ source, status, hash, name }, runStatus) {
    const promise = {
      url: ApiHelper.getUrl(source, status),
      body: this.getBody(source, status, hash, name, runStatus)
    };

    return source === 'workflow' ? this.asyncFetch(promise) : this.pushToPromises(promise);
  }

  /**
   * @return {Boolean}
   * @private
   */
  _isWorkflowUseCase() {
    return ['apply', 'build', 'destroy', 'init', 'plan', 'run', 'workspace', 'import'].includes(this.commandName);
  }

  /**
   * @param {String} source
   * @param {String} status
   * @return {string}
   */
  static getUrl(source, status) {
    return `thub/${source === 'workflow' ? 'run' : 'component'}/${status}`;
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
    const time = status === 'create' ? 'componentStartedAt' : 'componentFinishedAt';

    if (status === 'create') {
      this._componentsExecutionList[hash] = name;
    }

    return {
      hash,
      name,
      runId: this.runId,
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
    const time = status === 'create' ? 'runStartedAt' : 'runFinishedAt';

    return {
      runId: this.runId,
      [time]: new Date().toISOString().slice(0, 19).replace('T', ' '),
      projectHash: this.projectHash,
      projectName: this.projectName,
      runStatus: ApiHelper.getRunStatus(status, runStatus),
      runWorkspace: this.environment || 'default'
    };
  }

  /**
   * @param {String} status
   * @param {Number} runStatus
   * @return {Number}
   */
  static getRunStatus(status, runStatus) {
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
   * @return {Boolean}
   */
  get isCloudDeployer() {
    return ['lambda', 'fargate'].includes(this.distributor);
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
  saveRealtimeAndLogs() {
    if (this.canApiLogsBeSent() && this._apiLogginStart) {
      return Promise.all([
        this.fetch
          .post(`https://${this.config.api}.terrahub.io/v1/thub/logs/save/${this.runId || process.env.THUB_RUN_ID}`)
          .catch(error => console.log(error)),
        this.fetch
          .post(`https://${this.config.api}.terrahub.io/v1/thub/realtime/save/${this.runId || process.env.THUB_RUN_ID}`)
          .catch(error => console.log(error))
      ]);
    }
  }

  /**
   * On error sends finish status for all logging executions
   */
  sendErrorToApi() {
    if (this.tokenIsValid && this._apiLogginStart) {
      const runStatus = Dictionary.REALTIME.ERROR;
      this._errors.push(true);

      this.endComponentsLogging();
      this.sendMainWorkflow({ status: 'update' }, runStatus);
    }
  }

  /**
   * Finish components logging
   */
  endComponentsLogging() {
    Object.keys(this._componentsExecutionList).forEach(hash => {
      const status = 'update',
        source = 'component',
        name = this._componentsExecutionList[hash];

      this.sendDataToApi({ source, status, name, hash });
    });
  }

  /**
   * @return {Promise}
   */
  async retrieveCloudAccounts() {
    if (!this._cloudAccounts) {
      const result = await this.fetch.get(`https://${this.config.api}.terrahub.io/v1/thub/cloud-account/retrieve`);
      this._cloudAccounts = result.data;
    }

    return this._cloudAccounts;
  }
}

module.exports = new ApiHelper();
