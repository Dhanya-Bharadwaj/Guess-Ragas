const fs = require('fs');
const path = require('path');

// Copy audio files from src/assets/ragas -> public/assets/ragas and emit a manifest
const SRC_DIR = path.join(__dirname, '..', 'src', 'assets', 'ragas');
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'ragas');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFiles() {
  ensureDir(OUT_DIR);
  if (!fs.existsSync(SRC_DIR)) {
    console.warn('[move_audio] Source directory not found:', SRC_DIR);
    return;
  }
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.toLowerCase().match(/\.(mp3|wav|ogg|m4a)$/));
  const manifest = [];
  files.forEach((f) => {
    const src = path.join(SRC_DIR, f);
    const dest = path.join(OUT_DIR, f);
    try {
      fs.copyFileSync(src, dest);
      manifest.push(`/assets/ragas/${f}`);
      console.log(`[move_audio] Copied ${f}`);
    } catch (err) {
      console.warn('[move_audio] Failed to copy', f, err.message || err);
    }
  });
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  try {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('[move_audio] Wrote manifest.json with', manifest.length, 'entries');
  } catch (err) {
    console.warn('[move_audio] Failed to write manifest.json', err.message || err);
  }
}

copyFiles();

// Exit with success so build can continue; any copy failures are warnings only
process.exit(0);
