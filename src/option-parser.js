'use strict';

const parseArgs = require('minimist');

class OptionParser {

  /**
   * Directory with command classes
   * @returns {*}
   */
  static get commandsPath() {
    return path.join(__dirname, 'commands');
  }
}

module.exports = OptionParser;
