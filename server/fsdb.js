const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'database.json');

function readRaw() {
  try {
    const txt = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(txt || '{}');
  } catch (e) {
    return {};
  }
}

function writeAtomic(obj) {
  const tmp = DB_PATH + '.tmp';
  const txt = JSON.stringify(obj, null, 2);
  fs.writeFileSync(tmp, txt, 'utf8');
  fs.renameSync(tmp, DB_PATH);
}

function ensureMeta(db) {
  if (!db.__meta || typeof db.__meta !== 'object') {
    db.__meta = { version: 1, updatedAt: new Date().toISOString() };
  } else if (db.__meta && db.__meta.updatedAt && typeof db.__meta.updatedAt === 'number') {
    // normalize older numeric timestamps to ISO strings
    db.__meta.updatedAt = new Date(db.__meta.updatedAt).toISOString();
  }
  return db;
}

function readFull() {
  const db = readRaw();
  return ensureMeta(db);
}

// Patch a single field of an item identified by `id` across all top-level arrays.
// clientVersion must equal current global version in file to apply.
function patchById(id, field, value, clientVersion) {
  if (!id) return { ok: false, error: 'missing-id' };
  const db = readRaw();
  ensureMeta(db);

  const currentVersion = db.__meta.version;
  if (typeof clientVersion !== 'number' || clientVersion !== currentVersion) {
    return { ok: false, error: 'version-mismatch', currentVersion };
  }

  let found = false;
  let updatedItem = null;

  for (const key of Object.keys(db)) {
    if (key === '__meta') continue;
    const col = db[key];
    if (Array.isArray(col)) {
      for (let i = 0; i < col.length; i++) {
        const it = col[i];
        if (it && it.id === id) {
          const merged = Object.assign({}, it, { [field]: value });
          col[i] = merged;
          found = true;
          updatedItem = merged;
          break;
        }
      }
      if (found) break;
    }
  }

  if (!found) return { ok: false, error: 'not-found' };

  // update meta and persist atomically
  db.__meta.version = currentVersion + 1;
  db.__meta.updatedAt = new Date().toISOString();
  try {
    writeAtomic(db);
  } catch (e) {
    // Do not throw: return structured error for caller to map to HTTP 500
    return { ok: false, error: 'write-failed', detail: e && e.message ? e.message : String(e) };
  }

  return { ok: true, item: updatedItem, newVersion: db.__meta.version, updatedAt: db.__meta.updatedAt };
}

module.exports = {
  readFull,
  patchById,
};
