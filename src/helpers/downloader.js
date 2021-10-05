'use strict';

const os = require('os');
const url = require('url');
const fse = require('fs-extra');
const { join } = require('path');
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
  downloadTerraform(version, distributor) {
    const urlBuildDownload = Downloader._buildSrcUrl(version);
    const terraformBinaryDir = distributor === 'lambda'
      ? homePathLambda('terraform', version)
      : homePath('terraform', version);

    return fse
      .ensureDir(terraformBinaryDir)
      .then(() => download(urlBuildDownload, terraformBinaryDir, { extract: true }));
  }

  /**
   * Download file & unzip file
   * @param {String} version
   * @param {String} extraBinaryFile
   * @param {String} distributor
   * @returns {Promise}
   */
  downloadExtraFiles(version, extraBinaryFile, distributor) {
    const arch = Downloader.getOsArch();
    const extension = arch.indexOf('windows') > -1 ? '.exe' : '';
    const extraDownload = Downloader._extraSrcUrl(version);
    const extraBinaryDir = distributor === 'lambda'
      ? homePathLambda('converter')
      : homePath('converter');

    return fse
      .ensureDir(extraBinaryDir)
      .then(() => download(extraDownload, extraBinaryDir, { extract: true }))
      .then(() => fse.chmod(
        join(extraBinaryDir, `terrahub-converter-${version}`, arch, `${extraBinaryFile}${extension}`), '777')
      );
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
   * @param {String} version
   * @returns {String}
   */
  static _extraSrcUrl(version) {
    return url.resolve(
      'https://github.com/tfxor/terrahub-converter/archive/refs/tags/', `v${version}.zip`
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
