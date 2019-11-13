'use strict';

class Dictionary {

  /**
   * @return {{SUCCESS: number, SKIP: number, START: number, ERROR: number, ABORT: number, TIMEOUT: number}}
   */
  static get REALTIME() {
    return {
      SUCCESS: 0,
      SKIP: 1,
      START: 2,
      ERROR: 3,
      ABORT: 4,
      TIMEOUT: 5
    };
  }

  /**
   * @return {{WHITE: number, GRAY: number, BLACK: number}}
   */
  static get COLOR() {
    return {
      BLACK: 0,
      WHITE: 1,
      GRAY: 2
    };
  }

  /**
   * @return {{FORWARD: number, REVERSE: number, BIDIRECTIONAL: number}}
   */
  static get DIRECTION() {
    return {
      FORWARD: 0,
      REVERSE: 1,
      BIDIRECTIONAL: 2
    };
  }

  /**
   * @return {{SPECIFIC: number, DEFAULT: number, EVERY: number}}
   */
  static get ENVIRONMENT() {
    return {
      DEFAULT: 0,
      SPECIFIC: 1,
      EVERY: 2
    };
  }

  /**
   * @return {{APP_ENGINE: string, FARGATE: string, CLOUD_FUNCTIONS: string, LOCAL: string, LAMBDA: string}}
   */
  static get DISTRIBUTOR() {
    return {
      LOCAL: 'local',
      LAMBDA: 'lambda',
      FARGATE: 'fargate',
      APP_ENGINE: 'appEngine',
      CLOUD_FUNCTIONS: 'cloudFunctions'
    };
  }
}

module.exports = Dictionary;
