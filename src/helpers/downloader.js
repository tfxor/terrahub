'use strict';

const os = require('os');
const url = require('url');
const fse = require('fs-extra');
const { join } = require('path');
const download = require('download');
const { execSync } = require('child_process');
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
    const urlBuildDownload = Downloader._buildSrcUrl(version, distributor);
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
   * @param {String} distributor
   * @returns {Promise}
   */
  downloadExtraFiles(version, distributor) {
    const arch = Downloader.getOsArch(distributor, version);
    const extension = arch.indexOf('windows') > -1 ? '.exe' : '';
    const extraDownload = Downloader._extraSrcUrl(version);
    const extraBinaryDir = distributor === 'lambda'
      ? homePathLambda('converter')
      : homePath('converter');

    return fse
      .ensureDir(extraBinaryDir)
      .then(() => download(extraDownload, extraBinaryDir, { extract: true }))
      .then(() => fse.chmod(
        join(extraBinaryDir, `terrahub-converter-${version}`, arch, `arch${extension}`), '777')
      )
      .then(() => fse.chmod(
        join(extraBinaryDir, `terrahub-converter-${version}`, arch, `component${extension}`), '777')
      )
      .then(() => fse.chmod(
        join(extraBinaryDir, `terrahub-converter-${version}`, arch, `converter${extension}`), '777')
      );
  }

  /**
   * @param {String} version
   * @param {String} distributor
   * @returns {String}
   */
  static _buildSrcUrl(version, distributor) {
    const arch = Downloader.getOsArch(distributor, version);
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
   * @param {String} distributor
   * @param {String} version
   * @returns {String}
   */
  static getOsArch(distributor, version) {
    let nodeArch,
      nodePlatform;

    const extraBinaryDir = distributor === 'lambda'
      ? homePathLambda('converter')
      : homePath('converter');

    switch (os.arch()) {
      case 'x32':
        nodeArch = '386';
        break;
      case 'x64':
        nodeArch = 'amd64';
        break;
      default:
        nodeArch = os.arch();
    }

    switch (os.platform()) {
      case 'sunos':
        nodePlatform = 'solaris';
        break;
      case 'win32':
        nodePlatform = 'windows';
        break;
      default:
        nodePlatform = os.platform();
    }

    const extension = nodeArch.indexOf('windows') > -1 ? '.exe' : '';

    const archPath = join(
      extraBinaryDir, `terrahub-converter-${version}`, `${nodePlatform}_${nodeArch}`, `arch${extension}`
    );

    try {
      const stat = fse.statSync(archPath);

      if (stat !== null && stat.isFile()) {
        const goarch = execSync(`${archPath} --goarch`);
        const arch = goarch.toString().replace('\n', '');

        const goos = execSync(`${archPath} --goos`);
        const platform = goos.toString().replace('\n', '');

        return `${platform}_${arch}`;
      }
    } catch (error) {
      switch (error.code) {
        case 'ENOENT':
          return `${nodePlatform}_${nodeArch}`;
        default:
          throw error;
      }
    }
  }

}

module.exports = Downloader;
