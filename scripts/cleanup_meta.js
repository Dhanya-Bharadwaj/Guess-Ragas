const fs = require('fs');
const path = require('path');

function cleanFile(relPath) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('JSON parse error in', filePath, e.message);
    return;
  }

  let changed = false;
  Object.keys(data).forEach(key => {
    const entry = data[key];
    if (entry && Object.prototype.hasOwnProperty.call(entry, 'notes')) {
      if (Array.isArray(entry.notes) && entry.notes.length === 0) {
        delete entry.notes;
        changed = true;
      }
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('Cleaned empty notes in', relPath);
  } else {
    console.log('No empty notes to remove in', relPath);
  }
}

cleanFile('src/data/melakarta_meta.json');
cleanFile('src/data/janya_meta.json');
