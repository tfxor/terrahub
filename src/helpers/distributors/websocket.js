'use strict';

const WebSocket = require('ws');


class Websocket {

  constructor(env, ticket) {
    this.baseUrl = `wss://apiws-${env.split('-')[1]}.terrahub.io/v1`;
    this.ws = new WebSocket(`${this.baseUrl}?ticket_id=${ticket}`);

    // this.listen();

  }

  listen() {
    this.ws.on('message', message => this.onMessage(message));
    this.ws.on('error', error => this.onError(error));
    this.ws.on('close', message => this.onClose(message));
  }

  async onFinish() {
    await this.ws.on('message', message => {
      try {
        const msg = JSON.parse(message);

        if (msg.action === 'aws-cloud-deployer' && msg.data.status === 'finish') {
          return msg.data;
        }
      } catch (err) {
        throw new Error(err);
      }
    });
  }

  async onMessage(message) {
    try {
      const data = JSON.parse(message);

      console.log('onMessage: ', data);

      switch (data.action) {
        case 'aws-cloud-deployer':
          return this.onAwsCloud(data);
        case 'logs':
          return this.onAwsLogs(data);
        case 'realtime':
          return this.onAwsRealtime(data);
        default:
          return false;

      }
    } catch (err) {
      throw new Error(err);
    }
  }

  onAwsLogs(data) {
    const parsedData = data.data.map(it => it.log);
    console.log('onAWsLogs :', parsedData);
    return parsedData;
  }

  onAwsCloud(data) {
    if (data.status === 'finish') {
      const { message, hash } = data;
      return this.onFinish(message, hash);
    }
  }

  onAwsRealtime(data) {
    return data.data;
  }

  onError(error) {
    console.error('onError :', error);
  }

  onClose(message) {
    console.log('onClose :', message);
  }
}

module.exports = Websocket;
