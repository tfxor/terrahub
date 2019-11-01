'use strict';

const WebSocket = require('ws');

class Websocket {

  constructor(env, ticket) {
    this.baseUrl = `wss://apiws-${env.split('-')[1]}.terrahub.io/v1`;
    this.ws = new WebSocket(`${this.baseUrl}?ticket_id=${ticket}`);

  }

  // listen() {
  //   this.ws.on('message', message => this.onMessage(message));
  //   this.ws.on('error', error => this.onError(error));
  //   this.ws.on('close', message => this.onClose(message));
  // }
  //
  // async parseFinishMessage(message) {
  //   const msg = JSON.parse(message);
  //
  //   if (msg.action === 'aws-cloud-deployer' && msg.data.status === 'finish') {
  //     await msg.data;
  //   }
  // }
  //
  // async onMessage(message) {
  //   try {
  //     const msg = JSON.parse(message);
  //
  //     switch (msg.action) {
  //       case 'aws-cloud-deployer':
  //         return this.onAwsCloud(msg.data);
  //       case 'logs':
  //         return this.onAwsLogs(msg.data);
  //       case 'realtime':
  //         return this.onAwsRealtime(msg.data);
  //       default:
  //         return false;
  //     }
  //   } catch (err) {
  //     throw new Error(err);
  //   }
  // }
  //
  // onAwsLogs(data) {
  //   const parsedData = data.map(it => it.log);
  //   console.log('onAWsLogs :', parsedData);
  //   return parsedData;
  // }
  //
  // onAwsCloud(data) {
  //   data.status === 'finish' ? this.emit('finish', data) : null;
  // }
  //
  // onAwsRealtime(data) {
  //   console.log('onAwsRealtime :', data);
  //   return data;
  // }
  //
  // onError(error) {
  //   console.error('onError :', error);
  // }
  //
  // onClose(message) {
  //   console.log('onClose :', message);
  // }
}

module.exports = Websocket;
