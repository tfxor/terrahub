'use strict';

const { exec } = require('child_process');
const treeify = require('treeify');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const ProgressBar = require('progress');

const TerraformCommand = require('../terraform-command');
const Terraform = require('../terraform/terraform');

class PlanCommand extends TerraformCommand {

  /**
   * @desc Validates options passed via cli
   *
   * @returns {Boolean} - Returns true if options given from cli are valid.
   *
   * @private
   */
  _validateOptions() {
    this._logger.debug(`this._cli : ${this._cli}`);

    return super._validateOptions();
  }

  /**
   * @desc Executes `terraform plan` across multiple terraform scripts
   */
  run() {
    this._layers=[[]];
    this._folders = {};
    this._graph = {};
    this.getFilesPath([this._directory]).forEach(element => {
      if (fs.existsSync(element)) {

        let tfsConf = yaml.safeLoad(fs.readFileSync(`${element}/${this._paramFile}`, 'utf8'));
        this._folders[tfsConf.id] = element;
        if (tfsConf && tfsConf.parent) {
          this._graph[tfsConf.id] = tfsConf.parent ;
        } else {
          if (!this._graph[tfsConf.id]) {
            this._graph[tfsConf.id] = null;
            this._layers[0].push(tfsConf.id);
          }

        }
      }
    });

    console.log('Building tree:');
    let graph = this._graph;
    if (this._cli.branch) {
      graph = this.findBranch(this._graph);
      console.log(treeify.asTree(this.listToTree(graph),true));
    } else {
      console.log(treeify.asTree(this.listToTree(graph), true));
    }
    console.log('Start terraform plan\n');

    if (!this._verbose) {
      this.bar = new ProgressBar('Run plan  [:bar] :percent :elapseds',
        { total: Object.keys(graph).length * 2, width: 30 });
      this.bar.tick(0);
    }
    this.plan();
    return Promise.resolve();
  }

  plan() {

    let bar = this.bar;
    let verbose = this._verbose;
    let tf = this.terraform();
    for (let id in this._layers) {
      let folders = this._folders;
      let promises = this._layers[id].map(async function(element) {
        let elementPath = folders[element];
        if (!verbose) {
          bar.tick();
        }
        tf.then((terraform) => {
          terraform.plan(elementPath).then(() => {
            if (!verbose) {
              bar.tick();
            }
          })});
      });
      Promise.all(promises);
    }
  }

  /**
   * @returns {String}
   */
  static get DESCRIPTION() {
    return 'run `terraform plan` across multiple terraform scripts'
  }

  /**
   * @returns {Array}
   */
  static get OPTIONS() {
    return [{
      opt: '-p, --provider [provider]',
      desc: 'terraform provider name (e.g. aws, azurerm, google)'
    }, {
      opt: '-i, --include  [comma_separated_values]',
      desc: 'comma separated values of terraform scripts or folders to be included'
    }, {
      opt: '-e, --exclude  [comma_separated_values]',
      desc: 'comma separated values of terraform scripts or folders to be excluded'
    }, {
      opt: '-d, --directory [directory]',
      desc: 'path where terraform will be executed (default value - current working directory)'
    }, {
      opt: '-b, --branch [branch]',
      desc: 'path where terraform will be executed (default value - current working directory)'
    }];
  }
}

module.exports = PlanCommand;
