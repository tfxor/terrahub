'use strict';

const logger = require('js-logger');

class Logger {
  /**
   * Constructor
   */
  constructor() {
    const level = (process.env.DEBUG || logger.INFO.name).toUpperCase();

    logger.useDefaults({
      defaultLevel: logger[ level ],
      formatter: (messages, context) => {}
    });

    this._logger = logger;
  }

  /**
   * Raw line output (without auto \n)
   * @param {String} message
   */
  raw(message) {
    process.stdout.write(message);
  }

  /**
   * @param {String} message
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
   * @param {String} message
   */
  error(message) {
    if (message instanceof Error) {
      const { name } = this._logger.getLevel();

      message = (name === logger.DEBUG.name)
        ? message.stack
        : message.message;
    }

    this._logger.error('❌', message);
  }
}

module.exports = new Logger();
