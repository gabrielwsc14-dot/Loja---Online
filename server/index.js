const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'database.json');
const SYNC_PREFIX = '/__sync';

function readDB() {
  try {
    const txt = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return {};
  }
}

function writeDB(obj) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write DB', e);
    return false;
  }
}

// API: get current DB
app.get('/api/db', (req, res) => {
  res.json(readDB());
});

// API: sync/overwrite or merge incoming DB
app.post('/api/sync', (req, res) => {
  let incoming = req.body;
  if (!incoming) return res.status(400).json({ error: 'missing body' });
  // allow both {db: {...}} and raw db object
  if (incoming.db) incoming = incoming.db;

  const server = readDB();

  // merge helper: add local-only items into server arrays by id
  const merged = Object.assign({}, server);
  for (const key of Object.keys(incoming)) {
    const sVal = server[key];
    const iVal = incoming[key];
    if (Array.isArray(sVal) && Array.isArray(iVal)) {
      const map = new Map();
      sVal.forEach(item => {
        const k = (item && item.id !== undefined) ? item.id : JSON.stringify(item);
        map.set(k, item);
      });
      iVal.forEach(item => {
        const k = (item && item.id !== undefined) ? item.id : JSON.stringify(item);
        if (!map.has(k)) map.set(k, item);
      });
      merged[key] = Array.from(map.values());
    } else if (sVal && typeof sVal === 'object' && iVal && typeof iVal === 'object') {
      merged[key] = Object.assign({}, sVal, iVal);
    } else {
      // prefer server value unless server missing
      merged[key] = sVal === undefined ? iVal : sVal;
    }
  }

  const ok = writeDB(merged);
  if (!ok) return res.status(500).json({ error: 'failed to write db' });
  return res.json({ ok: true, db: merged });
});

// Serve the client sync script from a dedicated prefix
app.get(SYNC_PREFIX + '/client-sync.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-sync.js'));
});

// Serve .html files with injection of the sync script (no on-disk changes)
app.get('/*.html', (req, res, next) => {
  const filePath = path.join(ROOT, req.path);
  if (!fs.existsSync(filePath)) return next();
  let html = fs.readFileSync(filePath, 'utf8');
  const inject = `<script src="${SYNC_PREFIX}/client-sync.js"></script>`;
  // inject before </body> if present, otherwise before </head>
  if (html.includes('</body>')) {
    html = html.replace('</body>', inject + '\n</body>');
  } else if (html.includes('</head>')) {
    html = html.replace('</head>', inject + '\n</head>');
  } else {
    html = inject + '\n' + html;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Serve static files (CSS, JS, images, etc.) from project root
app.use(express.static(ROOT));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BabyShop sync server running at http://localhost:${PORT}/`);
  console.log('Serving project root:', ROOT);
});
