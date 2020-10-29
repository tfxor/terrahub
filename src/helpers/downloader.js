'use strict';

const os = require('os');
const url = require('url');
const path = require('path');
const fse = require('fs-extra');
const download = require('download');
const { homePath, homePathLambda } = require('./util');

/**
 * Terraform binaries downloader
 */
class Downloader {
  /**
   * Download & unzip file
   * @param {String} version
   * @param {String} distributor
   * @returns {Promise}
   */
  download(version, distributor) {
    const urlDownload = Downloader._buildSrcUrl(version);
    const binaryDir = distributor === 'lambda'
      ? homePathLambda('terraform', version)
      : homePath('terraform', version);

    if (path.join(binaryDir, 'terraform')) {
      return Promise.resolve();
    }

    return fse
      .ensureDir(binaryDir)
      .then(() => download(urlDownload, binaryDir, { extract: true }));
  }

  /**
   * @param {String} version
   * @returns {String}
   */
  static _buildSrcUrl(version) {
    const arch = Downloader.getOsArch();

    return url.resolve(
      'https://releases.hashicorp.com/terraform/', `${version}/terraform_${version}_${arch}.zip`
    );
  }

  /**
   * @returns {String}
   */
  static getOsArch() {
    let arch,
      platform;

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

    return `${platform}_${arch}`;
  }

}

module.exports = Downloader;
