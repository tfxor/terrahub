'use strict';

const { fetch, config: { api } } = require('../parameters');

class ApiHelper {

  constructor() {
    this._promises = [];
  }

  /**
   * @param {Object} promise
   */
  pushToPromises(promise) { //@todo this piece of shit do not work, AbstractTerrahub(Terrahub) run parallel
    this._promises.push(promise);
  }

  retrievePromises() {
    return this._promises;
  }

  static canApiLogsBeSent() {
    return process.env.THUB_TOKEN_IS_VALID;
  }

  fetchRequests() {
    const _promises = this._promises.map(({ url, body }) => {
      return fetch.post(url, {
        body: JSON.stringify(body)
      }).catch(err => console.log(err))
    });

    return Promise.all(_promises);
  }

  /**
   * @param {{
   *  [runId]: String,
   *  [status]: String,
   *  [target]: String,
   *  [action]: String,
   *  [name]: String,
   *  [hash]: String,
   *  [projectHash]: String,
   *  [projectName]: String,
   *  [terraformWorkspace]: String
   *  }}
   * @param {*} args
   * @return {Promise}
   */
  sendWorkflowToApi({ runId, status, target, action, name, hash, projectHash, terraformWorkspace, projectName }, ...args) {
    if (ApiHelper.canApiLogsBeSent) {
      const url = ApiHelper.composeWorkflowRequestUrl(status, target);

      if (ApiHelper.isWorkflowUseCase(target, status, action)) {
        const body = ApiHelper.composeWorkflowBody(status, target, runId, name, hash, projectHash, terraformWorkspace, projectName);

        //@todo for sync on create
        // if (status === 'create' && target === 'workflow') {

        //   return fetch.post(`${url}`, {
        //     body: JSON.stringify(body)
        //   }).then(res => Promise.resolve(...args))
        //     .catch(error => {
        //       return Promise.resolve(...args);
        //     })
        // } else {
          this.pushToPromises({ url, body });
        // }
      }
    }

    return Promise.resolve(...args);
  }

  /**
   * @param {String} target
   * @param {String} status
   * @param {String} action
   * @return {boolean}
   */
  static isWorkflowUseCase(target, status, action) {
    switch (target) {
      case 'workflow':
        return ['apply', 'build', 'destroy', 'init', 'plan', 'run', 'workspace'].includes(action);
      case 'component':
        return ApiHelper.isComponentUseCase(status, action);
      default:
        return false;
    }
  }

  /**
   * @param status
   * @param action
   * @return {boolean}
   */
  static isComponentUseCase(status, action) {
    const _actions = process.env.TERRAFORM_ACTIONS.split(',');

    if (status === 'create') {
      const _firstAction = _actions[0] === 'prepare' ? _actions[1] : _actions[0];

      return _firstAction === action && _firstAction !== 'plan';
    } else if (status === 'update') {
      const _finalAction = _actions.pop();

      return action === _finalAction;
    }

    return false;
  }

  /**
   * @param {String} status
   * @param {String} target
   * @return {String}
   */
  static composeWorkflowRequestUrl(status, target) {
    return `thub/${target === 'workflow' ? 'terraform-run' : 'terrahub-component'}/${status}`;
  }

  /**
   *
   * @param {String} status
   * @param {String} target
   * @param {String} [runId]
   * @param {String} [name]
   * @param {String} [hash]
   * @param {String} [projectHash]
   * @param {String} [projectName]
   * @param {String} [terraformWorkspace]
   * @return {Object}
   */
  static composeWorkflowBody(status, target, runId, name, hash, projectHash, terraformWorkspace, projectName) {
    if (target === 'workflow') {
      const time = status === 'create' ? 'terraformRunStarted' : 'terraformRunFinished';
      const body = {
        'terraformRunId': runId,
        [time]: new Date().toISOString().slice(0, 19).replace('T', ' '),
        projectHash,
        projectName // @todo: in update to not need
      };

      return terraformWorkspace ? Object.assign(body, { 'terraformWorkspace': terraformWorkspace }) : body;
    } else if (target === 'component') {
      const time = status === 'create' ? 'terrahubComponentStarted' : 'terrahubComponentFinished';

      return {
        'terraformHash': hash,
        'terraformName': name,
        'terraformRunUuid': runId,
        [time]: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
    }
  }

  /**
   * @return {Promise}
   */
  sendLogToS3(runId) {
    if (ApiHelper.canApiLogsBeSent) {
      // return fetch.post(`https://${api}.terrahub.io/v1/elasticsearch/logs/save/${runId}`)
      //   .catch(error => console.log(error));
    }
  }

  /**
   * On error sends finish status for all logging executions
   * @param {String} runId
   * @param {String} projectHash
   */
  sendErrorToApi(runId, projectHash) {
    if (ApiHelper.canApiLogsBeSent) {
      const url = ApiHelper.composeWorkflowRequestUrl('update', 'workflow');
      const body = ApiHelper.composeWorkflowBody('update', 'workflow', runId, null, null, projectHash);

      this.endComponentsLogging(runId);
      this.pushToPromises({ url, body });
    }
  }

  /**
   * Finish components logging
   * @param {String} runId
   * @private
   */
  endComponentsLogging(runId) {
    const terrahubComponents = process.env.THUB_EXECUTION_LIST ? process.env.THUB_EXECUTION_LIST.split(',') : [];

    terrahubComponents.map(it => {
      const status = 'update',
        target = 'component',
        name = it.split(':')[0],
        hash = it.split(':')[1];

      const url = ApiHelper.composeWorkflowRequestUrl(status, target);
      const body = ApiHelper.composeWorkflowBody(status, target, runId, name, hash);

      this.pushToPromises({ url, body });
    });
  }
}

module.exports = new ApiHelper();