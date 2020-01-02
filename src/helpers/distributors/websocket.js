'use strict';

const WebSocket = require('ws');

class Websocket {

  /** Constructor
   * @param {String} env
   * @param {String} ticket
   */
  constructor(env, ticket) {
    const environment = env === 'api' ? '' : `-${env.split('-')[1]}`;
    this.baseUrl = `wss://apiws${environment}.terrahub.io/v1`;
    this.ws = new WebSocket(`${this.baseUrl}?ticket_id=${ticket}`);
  }
}

module.exports = Websocket;
