'use strict';

const os = require('os');
const fse = require('fs-extra');
const url = require('url');
const download = require('download');
const { homePath } = require('../parameters');

/**
 * Terraform binaries downloader
 */
class Downloader {
  /**
   * Download & unzip file
   * @param {String} version
   * @returns {Promise}
   */
  download(version) {
    const url = this._buildSrcUrl(version);
    const binaryDir = homePath('terraform', version);

    return fse
      .ensureDir(binaryDir)
      .then(() => download(url, binaryDir, { extract: true }));
  }

  /**
   * @param {String} version
   * @returns {String}
   */
  _buildSrcUrl(version) {
    let arch, platform;

    switch (os.arch()) {
      case 'x32':
        arch = '386';
        break;
      case 'x64':
        arch = 'amd64';
        break;
      default:
        arch = os.arch();
    }

    switch (os.platform()) {
      case 'sunos':
        platform = 'solaris';
        break;
      case 'win32':
        platform = 'windows';
        break;
      default:
        platform = os.platform();
    }

    return url.resolve(
      'https://releases.hashicorp.com/terraform/', `${version}/terraform_${version}_${platform}_${arch}.zip`
    );
  }
}

module.exports = Downloader;
