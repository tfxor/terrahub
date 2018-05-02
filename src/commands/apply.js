'use strict';

const AbstractCommand = require('../abstract-command');

class ApplyCommand extends AbstractCommand {
  /**
   * @param {Object} input
   */
  constructor(input) {
    super(input);

    this._test = this.getOption('test');

    console.log(this._test);
  }

  configure() {
    this
      .setName('apply')
      .addOption('test', 't', 'My test', 123)
    ;
  }

  run() {

  }
}

module.exports = ApplyCommand;
