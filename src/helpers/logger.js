'use strict';

// const { EOL } = require('os');
// const { join } = require('path');
// const fs = require('fs-extra');

const cluster = require('cluster');
const logger = require('js-logger');
const ApiHelper = require('./api-helper');
const { config: { logs } } = require('../parameters');

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
      canLogBeSentToApi: ApiHelper.canApiLogsBeSent(),
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
    if (cluster.isWorker) {
      process.send({
        workerId: cluster.worker.id,
        type: 'logs',
        messages,
        context: this._context,
      });
    } else {
      ApiHelper.sendLogsToApi({ messages, context: this._context });
    }
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

}

module.exports = new Logger();
