'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const logger = require('../logger');
const Metadata = require('../metadata');
const ApiHelper = require('../api-helper');
const Dictionary = require('../dictionary');
const Prepare = require('../prepare-helper');
const {
  spawner, prepareCredentialsFile, createCredentialsFile, removeAwsEnvVars,
  setupAWSSharedFile, parseCloudConfig
} = require('../util');

class Terraform {
  /**
   * @param {Object} config
   * @param {Object} parameters
   */
  constructor(config, parameters) {
    this._config = config;
    this._tf = this._config.terraform;
    this._distributor = this._config.distributor;
    this._envVars = process.env;
    this._metadata = new Metadata(this._config, parameters);
    this.parameters = parameters;

    this._showLogs = !process.env.format;
    this._isWorkspaceSupported = Prepare._checkWorkspaceSupport(this._config);
  }

  /**
   * Terraform module name
   * @return {String}
   */
  getName() {
    return this._config.name || this._config.root;
  }

  /**
   * Prepare -var
   * @return {Array}
   * @private
   */
  _var() {
    return Object.keys(this._tf.var).map(name => `-var='${name}=${this._tf.var[name]}'`);
  }

  /**
   * Prepare -backend-config
   * @return {Array}
   * @private
   */
  _backend() {
    return Object.keys(this._tf.backend).map(name => `-backend-config='${name}=${this._tf.backend[name]}'`);
  }

  /**
   * Setup env vars for use cloudAccount & terraform backend for backendAccount properties
   * @return {Promise}
   * @private
   */
  async _setupVars() {
    const accounts = Object.keys(this._tf).filter(it => /Account/.test(it));
    const configs = Object.keys(this._tf).filter(it => /backendConfig|cloudConfig/.test(it));

    if (this._distributor === 'local' && (!accounts.length || !process.env.THUB_TOKEN_IS_VALID) && !configs.length) {
      return Promise.resolve();
    }
    if (this._distributor === 'lambda') { removeAwsEnvVars(); }

    ApiHelper.init(this.parameters, this._distributor);

    let cloudAccounts = {};
    const provider = Array.isArray(this._config.template.provider)
      ? Object.keys(this._config.template.provider[0]).toString()
      : Object.keys(this._config.template.provider).toString();
    const providerProfile = Array.isArray(this._config.template.provider)
      ? this._config.template.provider[0][provider].profile || 'default'
      : this._config.template.provider[provider].profile || 'default';

    if (accounts.length && process.env.THUB_TOKEN_IS_VALID) {
      cloudAccounts = await ApiHelper.retrieveCloudAccounts();
    }
    if (configs.length > 0) {
      cloudAccounts.aws = [];

      configs.forEach(configName => {
        switch (configName) {
          case 'backendConfig':
            if (!this._tf[configName].profile && !this._tf[configName].access_key) {
              this._tf[configName].profile = providerProfile;
              if (this._tf[configName].profile === 'default') {
                delete this._tf[configName].profile;
              }
            }
            Object.assign(this._tf.backend, this._tf[configName]);
            break;
          case 'cloudConfig':
            if (provider !== 'aws') {
              return Promise.resolve();
            }
            const forConcat = parseCloudConfig(provider, this._tf[configName]);
            cloudAccounts.aws = cloudAccounts.aws.concat(forConcat);
            break;
          default:
            break;
        }
      });
    }

    if (configs.includes('cloudConfig') && !accounts.includes('cloudAccount')) {
      accounts.push('cloudAccount');
      this._tf.cloudAccount = providerProfile;
    }
    if (
      !configs.includes('backendConfig')
      && !accounts.includes('backendAccount')
      && configs.includes('cloudConfig')) {
      accounts.push('backendAccount');
      this._tf.backendAccount = this._tf.cloudAccount;
    }

    const providerAccounts = cloudAccounts[provider];

    if (providerAccounts) {
      accounts.forEach(type => {
        const _value = this._tf[type];
        const accountData = providerAccounts.find(it => it.name === _value);
        if (!accountData) { return Promise.resolve(); }

        const sourceProfile = accountData.type === 'role'
          ? providerAccounts.find(it => it.id === accountData.env_var.AWS_SOURCE_PROFILE.id) : null;
        const credentials = prepareCredentialsFile(accountData, sourceProfile, this._config, false, this._distributor);

        switch (type) {
          case 'cloudAccount':
            removeAwsEnvVars();
            const cloudCredsPath = createCredentialsFile(credentials, this._config, 'cloud', this._distributor);
            setupAWSSharedFile(sourceProfile, cloudCredsPath, this._config, this._distributor, this._envVars);
            Object.assign(this._envVars, { AWS_PROFILE: accountData.name });
            break;
          case 'backendAccount':
            const backCredsPath = createCredentialsFile(credentials, this._config, 'backend', this._distributor);
            Object.assign(this._tf.backend, { shared_credentials_file: backCredsPath, profile: accountData.name });
            break;
          default:
            break;
        }
      });
    }

    return Promise.resolve();
  }

  /**
   * Prepare -var-file
   * @return {Array}
   * @private
   */
  _varFile() {
    const result = [];

    this._tf.varFile.forEach(fileName => {
      const varFile = path.join(this._metadata.getRoot(), fileName);

      if (fs.existsSync(varFile)) {
        result.push(`-var-file='${varFile}'`);
      }
    });

    return result;
  }

  /**
   * Re-init State & Plan paths
   * @note required after workspace & remote state
   * @return {Promise}
   * @private
   */
  _reInitPaths() {
    this._metadata.init();

    return Promise.resolve();
  }

  /**
   * https://www.terraform.io/docs/commands/init.html
   * @return {Promise}
   */
  async init() {
    await this._setupVars();

    return this.run(
      'init', ['-no-color', '-force-copy', this._optsToArgs({ '-input': false }), ...this._backend(), '.']
    )
      .then(() => this._reInitPaths())
      .then(() => ({ status: Dictionary.REALTIME.SUCCESS }));
  }

  /**
   * https://www.terraform.io/docs/commands/state/pull.html
   * @return {Promise}
   */
  statePull() {
    this._showLogs = false;

    return this.run('state', ['pull', '-no-color']).then(result => {
      this._showLogs = true;
      const backupPath = this._metadata.getStateBackupPath();
      const stdout = result.toString();
      const indexStart = stdout.indexOf('{');
      const pullStateContent = JSON.parse(
        stdout[0] !== '{'
          ? stdout.substring(indexStart, stdout.length)
          : stdout
      );

      return fse.ensureFile(backupPath)
        .then(() => fse.writeJson(backupPath, pullStateContent))
        .then(() => JSON.stringify(pullStateContent));
    });
  }

  /**
   * https://www.terraform.io/docs/commands/output.html
   * @return {Promise}
   */
  output() {
    const options = {};

    return this.run('output', (process.env.format === 'json' ? ['-json'] : []).concat(this._optsToArgs(options)))
      .then(buffer => ({ buffer: buffer }));
  }

  /**
   * https://www.terraform.io/docs/commands/workspace/select.html
   * @return {Promise}
   */
  workspaceSelect() {
    if (!this._isWorkspaceSupported) {
      return Promise.resolve();
    }
    const { workspace } = this._tf;

    return this.run('workspace', ['list'])
      .then(result => {
        const regexSelected = new RegExp(`\\*\\s${workspace}$`, 'm');
        const regexExists = new RegExp(`\\s${workspace}$`, 'm');
        const output = result.toString();

        return regexSelected.test(output) ?
          Promise.resolve({ status: Dictionary.REALTIME.SKIP }) :
          this.run('workspace', [regexExists.test(output) ? 'select' : 'new', workspace])
            .then(() => Promise.resolve({ status: Dictionary.REALTIME.SUCCESS }));
      })
      .then(res => this._reInitPaths().then(() => Promise.resolve(res)));
  }

  /**
   * https://www.terraform.io/docs/commands/workspace/delete.html
   * @return {Promise}
   */
  workspaceDelete() {
    if (!this._isWorkspaceSupported) {
      return Promise.resolve();
    }

    return this
      .run('workspace', ['select', 'default'])
      .then(() => this.run('workspace', ['delete', this._tf.workspace]));
  }

  /**
   * https://www.terraform.io/docs/commands/workspace/list.html
   * @return {Promise}
   */
  workspaceList() {
    this._showLogs = false;
    return this.run('workspace', ['list']).then(buffer => {
      const workspaces = buffer.toString().match(/[a-z]+/gm);
      const activeWorkspace = buffer.toString().match(/\*\s([a-z]+)/m)[1];

      return {
        activeWorkspace: activeWorkspace,
        workspaces: workspaces
      };
    });
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * @return {Promise}
   */
  plan() {
    const options = { '-out': this._metadata.getPlanPath(), '-input': false };
    const args = process.env.planDestroy === 'true' ? ['-no-color', '-destroy'] : ['-no-color'];
    const { providerId } = process.env;
    if (providerId) {
      const { targets } = this._config;
      if (targets.length) {
        Object.assign(options, { '-target': `${targets[providerId]}` });
      }
    }

    return this.run('plan', args.concat(this._varFile(), this._var(), this._optsToArgs(options)))
      .then(buffer => {
        const metadata = {};
        const regex = /\s*Plan: ([0-9]+) to add, ([0-9]+) to change, ([0-9]+) to destroy\./;
        const planData = buffer.toString().match(regex);

        let skip = false;
        if (planData) {
          const planCounter = planData.slice(-3);
          ['add', 'change', 'destroy'].forEach((field, index) => { metadata[field] = planCounter[index]; });
        } else {
          ['add', 'change', 'destroy'].forEach((field) => { metadata[field] = '0'; });
          skip = true;
        }

        const commandsList = this._envVars['TERRAFORM_ACTIONS'];
        if (commandsList === 'workspaceSelect,plan,apply'
          || commandsList === 'workspaceSelect,plan,destroy') {
          skip = false;
        }

        const planPath = this._metadata.getPlanPath();

        if (fse.existsSync(planPath)) {
          const backupPath = this._metadata.getPlanBackupPath();
          const planContent = fse.readFileSync(planPath).toString();

          fse.outputFileSync(backupPath, planContent);
        }

        return Promise.resolve({
          buffer: buffer,
          skip: skip,
          metadata: metadata,
          status: Dictionary.REALTIME.SUCCESS
        });
      });
  }

  /**
   * https://www.terraform.io/docs/import/index.html
   * @return {Promise}
   */
  async import() {
    const options = { '-input': false };
    const args = ['-no-color'];
    const lines = JSON.parse(process.env.importLines);
    const varFile = this._varFile()[0].split('/');
    let existedResouces = [];

    

    await this.resourceList()
      .then(elements => { existedResouces = elements; })
      .catch(() => { });
    let startImport = existedResouces.length === 0;

    for (const line of lines) {
      if (existedResouces.includes(line.fullAddress) && line.overwrite) {
        await this.run('state', ['rm', line.fullAddress]);
        startImport = true;
      }

      const isCorrectComponent = varFile.includes(`${line.component}_${line.hash}`) || line.component === '';

      if (isCorrectComponent && (startImport || !existedResouces.includes(line.fullAddress))) {
        await this.run('import',
          args.concat(
            line.provider,
            this._varFile(),
            this._var(),
            this._optsToArgs(options),
            this._optsToArgs(this._stateFile()),
            [line.fullAddress, line.value])
        ).catch(() => { });
      }
    }

    return Promise.resolve({});
  }

  /**
   * Prepare -state-out
   * @return {Object}
   * @private
   */
  _stateFile() {
    if (this._distributor === 'lambda') {
      return {'-state-out': `'${this._stateFilePath()}'`};
    }

    return {};
  }

  /**
   * Prepare -state-out-path
   * @return {String}
   * @private
   */
  _stateFilePath() {
    return path.join(this._metadata.getRoot(), 'localTfstate', 'terraform.tfstate');
  }

  /**
   * Prepare -state-out-path
   * @return {String}
   * @private
   */
  _stateFolderPath() {
    return path.join(this._metadata.getRoot(), 'localTfstate');
  }

  /**
   * Prepare backend path
   * @return {String}
   * @private
   */
  _backendPath() {
    return path.join(this._metadata.getRoot(), 'backend', 'terraform.tf');
  }

  /**
   * Prepare backend normal path
   * @return {String}
   * @private
   */
  _backendNormalPath() {
    return path.join(this._metadata.getRoot(), 'terraform.tf');
  }

  /**
   * https://www.terraform.io/docs/state/index.html
   * @return {Promise}
   */
  async resourceList() {
    try {
      const buffer = await this.run('state', ['list']);
      return buffer.toString().split('\n').filter(x => x);
    } catch (error) {
      return [];
    }
  }

  /**
   * https://www.terraform.io/docs/state/index.html
   * @return {Promise}
   */
  stateDelete() {
    const args = ['rm'];
    const resourceAddress = process.env.stateDelete;

    if (!resourceAddress.includes('*')) {
      return this.run('state', args.concat([resourceAddress]));
    }

    return this.resourceList()
      .then(elements => (elements.length > 0)
        ? elements.filter(elem => elem.includes((resourceAddress === '*' ? '' : resourceAddress.split('*')[0])))
        : []
      ).then(elements => (elements.length > 0)
        ? Promise.all(elements.map(element => this.run('state', args.concat([element]))))
        : Promise.resolve({})
      ).catch(() => { });
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * @return {Promise}
   */
  apply() {
    const backupPath = this._metadata.getStateBackupPath();
    fse.ensureFileSync(backupPath);
    const options = { '-backup': backupPath, '-auto-approve': true, '-input': false };

    return this.run('apply', ['-no-color'].concat(this._optsToArgs(options), this._metadata.getPlanPath()))
      .then(() => this._getStateContent())
      .then(buffer => ({ buffer: buffer, status: Dictionary.REALTIME.SUCCESS }));
  }

  /**
   * Get state content whether is remote or local
   * @return {Promise}
   * @private
   */
  _getStateContent() {
    if (this._metadata.isRemote()) {
      return this.statePull();
    }

    return fse.readFile(this._metadata.getStatePath());
  }

  /**
   * https://www.terraform.io/docs/commands/destroy.html
   * @return {Promise}
   */
  destroy() { return this.apply(); }

  /**
   * https://www.terraform.io/docs/commands/refresh.html
   * @return {Promise}
   */
  refresh() {
    const options = { '-backup': this._metadata.getStateBackupPath(), '-input': false };

    const localBackend = [];
    const { template } = this._config;
    if (template && template.hasOwnProperty('terraform')) {
      const { backend } = template.terraform;
      if (backend && backend.hasOwnProperty('local')) {
        localBackend.push(`-state=${backend.local.path}`);
      }
    }

    return this
      .run('refresh', ['-no-color'].concat(this._optsToArgs(options), this._varFile(), localBackend, this._var()));
  }


  /**
   * https://www.terraform.io/docs/commands/show.html
   * @param {String} planOrStatePath
   * @return {Promise<String>}
   */
  show(planOrStatePath) {
    return this.run('show', ['-json', planOrStatePath], true);
  }

  /**
   * Run terraform command
   * @param {String} cmd
   * @param {Array} args
   * @param {Boolen} isShow=false
   * @return {Promise}
   */
  async run(cmd, args, isShow=false) {
    if (this._config.project.env) {
      if (this._config.project.env.variables) {
        this._envVars = { ...this._envVars, ...this._config.project.env.variables };
      }
    }
    if (this._showLogs) {
      logger.warn(`[${this.getName()}] terraform ${cmd} ${args.join(' ')}`);
    }
    return this._spawn(Prepare.getBinary(this._config), [cmd, ...args], {
      cwd: this._metadata.getRoot(),
      env: this._envVars,
      shell: true
    }, isShow);
  }

  /**
   * Transform options into arguments
   * @param {Object} options
   * @return {Array}
   * @private
   */
  _optsToArgs(options) {
    const args = [];

    Object.keys(options).forEach(key => {
      args.push(`${key}=${options[key]}`);
    });

    return args;
  }

  /**
   * Handle a spawn
   * @param {String} command
   * @param {Array} args
   * @param {Object} options
   * @param {Boolen} isShow=false
   * @return {Promise}
   * @private
   */
  _spawn(command, args, options, isShow=false) {
    return spawner(
      command, args, options,
      err => logger.error(this._out(err)),
      data => {
        if (this._showLogs === true && isShow === false) {
          logger.raw(this._out(data));
        }
      }
    );
  }

  /**
   * @param {Buffer} data
   * @return {String}
   * @private
   */
  _out(data) {
    let stdout = data.toString();
    const indexStart = stdout.indexOf('{');

    stdout = stdout[0] !== '{' ? stdout.substring(indexStart, stdout.length) : stdout;

    if (stdout.slice(-3) === `\n\n\n`) {
      stdout = stdout.slice(0, -1);
    }

    return `[${this.getName()}] ${stdout}`;
  }
}

module.exports = Terraform;
