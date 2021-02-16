'use strict';

const WebSocket = require('ws');

class Websocket {

  /** Constructor
   * @param {String} api
   * @param {String} token
   */
  constructor(api, token) {
    this.baseUrl = `wss://${api.replace('api', 'apiws')}.terrahub.io`;
    this.ws = new WebSocket(`${this.baseUrl}?authorization=${token}&authSource=token`);
  }
}

module.exports = Websocket;
