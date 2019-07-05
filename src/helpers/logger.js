'use strict';

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

      if (this._isTokenValid() && logs) {
        this._sendLogToApi(messages);
      }
    });

    this._logger = logger;

    this._context = {
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

    if (this._isTokenValid()) {
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
   * @return {Boolean}
   * @private
   */
  _isTokenValid() {
    if (cluster.isWorker) {
      return process.env.THUB_TOKEN_IS_VALID;
    }

    return ApiHelper.tokenIsValid;
  }

  /**
   * @param {String[]} messages
   * @private
   */
  _sendLogToApi(messages) {
    if (cluster.isWorker) {
      this._sendMessageToMaster(messages);
    } else {
      ApiHelper.sendLogsToApi({ messages, context: this._context });
    }
  }

  /**
   * Send messages to ThreadDistributor to execute logging
   * @param messages
   * @private
   */
  _sendMessageToMaster(messages) {
    process.send({
      workerId: cluster.worker.id,
      type: 'logs',
      workerLogger: true,
      messages,
      context: this._context,
    });
  }

  /**
   * @param {{ runId: String?, componentName: String?, action: String?, canLogBeSentToApi: Boolean? }} context
   */
  updateContext(context) {
    Object.assign(this._context, context);
  }

}

module.exports = new Logger();
