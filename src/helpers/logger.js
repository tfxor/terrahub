'use strict';

const { EOL } = require('os');
const fs = require('fs-extra');
const { join } = require('path');
const logger = require('js-logger');
// const fetch = require('node-fetch').default;
const { fetch, config: { api, logs } } = require('../parameters');
const ApiHelper = require('./api-helper');

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

      if (this._canLogBeSentToApi && logs) {
        this._sendLogToApi(messages);
      }
    });

    this._logger = logger;

    this._promises = [];
    this._context = {
      canLogBeSentToApi: process.env.THUB_TOKEN_IS_VALID || false,
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

    if (this._canLogBeSentToApi && logs) {
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
    const url = `https://${api}.terrahub.io/v1/elasticsearch/document/create/${this._context.runId}?indexMapping=logs`;
    const body = {
      bulk: [{
        terraformRunId: this._context.runId,
        timestamp: Date.now(),
        component: this._context.componentName,
        log: message,
        action: this._context.action
      }]
    };

    this._pushFetchAsync(url, body);
    // ApiHelper.pushToPromises({url, body});
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
   * @param {String} url
   * @param {Object} body
   * @private
   */
  _pushFetchAsync(url, body) {
    const promise = fetch.post(`${url}`, {
      body: JSON.stringify(body)
    }).catch(error => console.log(error));

    this._promises.push(promise);
  }
}

module.exports = new Logger();
