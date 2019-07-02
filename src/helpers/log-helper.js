'use strict';

const Util = require('./util');
const logger = require('./logger');
const treeify = require('treeify');

/**
 * @static
 */
class LogHelper {
  /**
   * @param {Object|Array} config
   * @param {String} projectName
   */
  static printListCommaSeparated(config, projectName) {
    const components = Object.keys(config).map(key => config[key].name).join(', ');

    logger.log(`Project: ${projectName} | Component${components.length > 1 ? 's' : ''}: ${components}`);
  }

  /**
   * @param {Object|Array} config
   * @param {Object} projectName
   */
  static printListAsTree(config, projectName) {
    const componentList = Util.arrayToObject(Object.keys(config).map(key => config[key].name));

    logger.log(`Project: ${projectName}`);

    treeify.asLines(componentList, false, line => {
      logger.log(` ${line}`);
    });
  }

  /**
   * @param {Object|Array} config
   * @param {String} projectName
   * @param {Number} listLimit
   */
  static printListAuto(config, projectName, listLimit = 5) {
    const { length } = Object.keys(config);

    if (listLimit < 0 || length < listLimit) {
      LogHelper.printListAsTree(config, projectName);
    } else {
      LogHelper.printListCommaSeparated(config, projectName);
    }
  }
}

module.exports = LogHelper;
