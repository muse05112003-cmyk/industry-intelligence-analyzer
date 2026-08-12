'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const roots = ['src', 'scripts', 'tests'];
const files = roots.flatMap(root => fs.readdirSync(root)
  .filter(name => name.endsWith('.js'))
  .map(name => path.join(root, name)));

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
if (failed) process.exit(1);
console.log(`Syntax check passed for ${files.length} JavaScript files.`);

