'use strict';

const { EOL } = require('os');
const fs = require('fs-extra');
const { join } = require('path');
const logger = require('js-logger');
// const fetch = require('node-fetch').default;
const { fetch, config: { api } } = require('../parameters');

class Logger {
  /**
   * Constructor
   */
  constructor() {
    const level = (process.env.DEBUG || logger.INFO.name).toUpperCase();

    logger.useDefaults({
      defaultLevel: logger[level],
      formatter: (messages, context) => {}
    });

    const consoleHandler = logger.createDefaultHandler();
    logger.setHandler((messages, context) => {
      consoleHandler(messages, context);

      if (this._canLogBeSentToApi) {
        this._sendLogToApi(messages);
      }
    });

    this._logger = logger;

    this._promises = [];
    this._context = {
      canLogBeSentToApi: false,
      runId: null,
      componentName: null,
      action: null
    };
  }

  /**
   * Raw line output (without auto \n)
   * @param {String} message
   */
  raw(message) {
    process.stdout.write(message);

    if (this._canLogBeSentToApi) {
      this._sendLogToApi([message]);
    }
  }

  /**
   * @param {String|Error} message
   */
  debug(message) {
    this._logger.debug(message);
  }

  /**
   * @param {String} message
   */
  log(message) {
    this._logger.info(message);
  }

  /**
   * @param {String} message
   */
  info(message) {
    this._logger.info('✅', message);
  }

  /**
   * @param {String} message
   */
  warn(message) {
    this._logger.warn('💡', message);
  }

  /**
   * @param {String|Error} message
   */
  error(message) {
    if (message instanceof Error) {
      const { name } = this._logger.getLevel();

      message = (name === logger.DEBUG.name) ?
        message.stack :
        message.message;
    }

    this._logger.error('❌', message);
  }

  /**
   * @return {Promise[]}
   */
  get promises() {
    return this._promises;
  }

  /**
   * @param {String[]} messages
   * @private
   */
  _sendLogToApi(messages) {
    const message = Object.keys(messages).map(key => messages[key]).join('');

    const promise = fetch.post(`https://${api}.terrahub.io/v1/elasticsearch/document/create/${this._context.runId}?indexMapping=logs`, {
      body: JSON.stringify({
        terraformRunId: this._context.runId,
        timestamp: Date.now(),
        component: this._context.componentName,
        log: message,
        action: this._context.action
      })
    }).catch(error => console.log(error));

    // const promise = Promise.resolve();

    this._promises.push(promise);
  }

  /**
   * @return {Boolean}
   * @private
   */
  get _canLogBeSentToApi() {
    return this._context.canLogBeSentToApi;
  }

  /**
   * @param {{ runId: String?, componentName: String?, action: String?, canLogBeSentToApi: Boolean? }} context
   */
  updateContext(context) {
    Object.assign(this._context, context);
  }

  /**
   * @param {{ status: String, target: String, runId: String, action: String, name: String, hash: String }} options
   * @param {*} args
   * @return {Promise}
   */
  sendWorkflowToApi(options, ...args) {
    if (this._canLogBeSentToApi) {
      const { status, target, action, runId } = options;
      const url = Logger.composeWorkflowRequestUrl(status, target, runId);

      if (Logger.isWorkflowUseCase(target, status, action)) {
        const body = Logger.composeWorkflowBody(options);

        const promise = fetch.post(`${url}`, {
          body: JSON.stringify(body)
        }).catch(error => console.log(error));

        this._promises.push(promise);
      }
    }

    return Promise.resolve(...args);
  }

  /**
   * @param {String} target
   * @param {String} status
   * @param {String} action
   * @return {boolean}
   */
  static isWorkflowUseCase(target, status, action) {
    switch (target) {
      case 's3' :
        return true;
      case 'workflow':
        return ['apply', 'build', 'destroy', 'init', 'plan', 'run', 'workspace'].includes(action);
      case 'component':
        return Logger.isComponentUseCase(status, action);
      default:
        return false;
    }
  }

  /**
   * @param status
   * @param action
   * @return {boolean}
   */
  static isComponentUseCase(status, action) {
    const _actions = process.env.TERRAFORM_ACTIONS.split(',');

    if (status === 'create') {
      const _firstAction = _actions[0] === 'prepare' ? _actions[1] : _actions[0];

      return _firstAction === action && _firstAction !== 'plan';
    } else if (status === 'update') {
      const _finalAction = _actions.pop();

      return action === _finalAction;
    }

    return false;
  }

  /**
   * @param {String} status
   * @param {String} target
   * @param {String} runId
   * @return {String}
   */
  static composeWorkflowRequestUrl(status, target, runId) {
    if (target === 's3') return `https://${api}.terrahub.io/v1/elasticsearch/logs/save/${runId}`;

    return `thub/${target === 'workflow' ? 'terraform-run' : 'terrahub-component'}/${status}`;
  }

  /**
   * @param {{ status: String, target: String, runId: String, action: String, name: String, hash: String }} options
   * @return {Object}
   */
  static composeWorkflowBody(options) {
    const { status, target, runId, name, hash } = options;

    if (target === 'workflow') {
      const time = status === 'create' ? 'terraformRunStarted' : 'terraformRunFinished';
      return {
        'terraformRunId': runId,
        [time]: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
    } else if (target === 's3') {
      return {};
    } else {
      const time = status === 'create' ? 'terrahubComponentStarted' : 'terrahubComponentFinished';
      return {
        'terraformHash': hash,
        'terraformName': name,
        'terraformRunUuid': runId,
        [time]: new Date().toISOString().slice(0, 19).replace('T', ' ')

      };
    }
  }
}

module.exports = new Logger();
