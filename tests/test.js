const { execSync } = require('child_process');

const result = execSync('ls -al ~/.terrahub');
console.log(result.toString());
