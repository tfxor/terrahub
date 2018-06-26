const { packageJson } = require('../src/parameters');
const fs = require('fs');

/**
 * Saves build date in package.json
 */

const date = new Date();

const packageContent = JSON.parse(fs.readFileSync(packageJson));

packageContent.buildDate = date.toUTCString();

fs.writeFileSync(packageJson, JSON.stringify(packageContent, undefined, 2));