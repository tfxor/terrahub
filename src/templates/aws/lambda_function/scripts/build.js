#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const buffer = fs.readFileSync(0);
const { component, env } = JSON.parse(buffer.toString());

let command = `terrahub build --format json --include "${component}"`;
if (env !== 'default') {
  command += ` --env ${env}`;
}

const result = execSync(command, {
  cwd: `"${__dirname}/.."`,
  shell: true
}).toString().trim();

console.log(result);
