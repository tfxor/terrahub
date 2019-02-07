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
}

module.exports = Dictionary;
