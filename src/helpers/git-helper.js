'use strict';

const { EOL } = require('os');
const { execSync } = require('child_process');
const logger = require('./logger');

class GitHelper {
  /**
   * @param {Error} error
   * @param {String} appPath
   * @return {*}
   */
  static handleGitDiffError(error, appPath) {
    logger.debug(error);
    let message;

    if (error.stderr) {
      const stderr = error.stderr.toString();
      if (/not found/.test(stderr)) {
        message = 'Git is not installed on this device.';
      } else if (/Not a git repository/i.test(stderr)) {
        message = `Git repository not found in '${appPath}'.`;
      }
    }

    return { ...error, message };
  }

  /**
   * @param {String[]} commits
   * @param {String} appPath
   * @return {String[] | void}
   */
  static getGitDiff(commits, appPath) {
    let stdout;
    try {
      stdout = execSync(`git diff --name-only ${commits.join(' ')}`, { cwd: appPath, stdio: 'pipe' });
    } catch (error) {
      throw GitHelper.handleGitDiffError(error, appPath);
    }

    if (!stdout || !stdout.length) {
      return logger.warn('There are no changes between commits, commit and working tree, etc.');
    }

    return stdout.toString().split(EOL).slice(0, -1);
  }
}

module.exports = GitHelper;
