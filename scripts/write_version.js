const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const out = path.join(__dirname, '..', 'public', 'version.json');
ensure();

function ensure() {
  let ver = { ts: new Date().toISOString() };
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    ver.commit = sha;
  } catch (e) {
    // git not available in some CI, ignore
  }
  try {
    fs.writeFileSync(out, JSON.stringify(ver, null, 2), 'utf8');
    console.log('[write_version] wrote', out, ver);
  } catch (err) {
    console.warn('[write_version] failed to write version', err && err.message ? err.message : err);
  }
}
