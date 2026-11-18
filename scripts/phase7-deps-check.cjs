// Read-only local version check. Security determination comes from npm audit.
const fs = require('node:fs');
const path = require('node:path');
const required = { prisma: '7.10.1', '@prisma/client': '7.10.1', '@prisma/adapter-pg': '7.10.1', nodemailer: '10.3.1', postcss: '8.5.32' };
let failed = false;
for (const [name, expected] of Object.entries(required)) {
  try {
    const file = require.resolve(`${name}/package.json`);
    const actual = JSON.parse(fs.readFileSync(file, 'utf8')).version;
    const ok = actual === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${actual} (expected ${expected})`);
    if (!ok) failed = true;
  } catch (_) {
    try {
      const found = JSON.parse(fs.readFileSync(path.join(process.cwd(),'node_modules',name,'package.json'), 'utf8')).version;
      const ok = found === expected;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${found} (expected ${expected})`);
      if(!ok) failed = true;
    } catch (_2) { console.error(`FAIL ${name}: not installed`); failed = true; }
  }
}
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.warn('WARN: Prisma 7 requires a supported Node.js release (20.19+ or 22.12+).');
}
console.log('Run npm.cmd audit and npm.cmd audit --omit=dev to verify advisories.');
process.exitCode = failed ? 1 : 0;
