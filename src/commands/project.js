'use strict';

const os = require('os');
const fse = require('fs-extra');
const AbstractCommand = require('../abstract-command');

class ProjectCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('project')
      .setDescription('Project configuration')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {


    return Promise.resolve('Done');
  }
}

module.exports = ProjectCommand;
