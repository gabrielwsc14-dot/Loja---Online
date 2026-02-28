const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const fsdb = require('./fsdb');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const ROOT = path.resolve(__dirname, '..');
const SYNC_PREFIX = '/__sync';

// DB logic moved to server/fsdb.js

// API: get current DB
app.get('/api/db', (req, res) => {
  res.json(fsdb.readFull());
});

// API: sync/overwrite or merge incoming DB
// Atomic patch endpoint: accepts { id, field, value, version }
app.post('/api/patch', (req, res) => {
  try {
    const body = req.body || {};
    const { id, field, value, version } = body;
    if (!id || !field) return res.status(400).json({ error: 'missing id or field' });

    const result = fsdb.patchById(id, field, value, version);
    if (!result.ok) {
      if (result.error === 'version-mismatch') {
        return res.status(409).json({ error: 'version-mismatch', currentVersion: result.currentVersion });
      }
      if (result.error === 'not-found') return res.status(404).json({ error: 'not-found' });
      if (result.error === 'write-failed') return res.status(500).json({ error: 'internal', message: result.detail || 'write failed' });
      return res.status(400).json({ error: result.error || 'failed' });
    }

    return res.json({ ok: true, item: result.item, version: result.newVersion, updatedAt: result.updatedAt });
  } catch (e) {
    console.error('Unexpected error in /api/patch', e);
    return res.status(500).json({ error: 'internal', message: 'unexpected' });
  }
});

// Serve the fix-script-order script
app.get(SYNC_PREFIX + '/fix-script-order.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'fix-script-order.js'));
});

// Serve the client sync script from a dedicated prefix
app.get(SYNC_PREFIX + '/client-sync.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-sync.js'));
});

// Serve .html files with injection of fix-script-order + sync script (no on-disk changes)
app.get('/*.html', (req, res, next) => {
  const filePath = path.join(ROOT, req.path);
  if (!fs.existsSync(filePath)) return next();
  let html = fs.readFileSync(filePath, 'utf8');
  // Inject BOTH scripts before </head> to fix script loading order
  const injectFix = `<script src="${SYNC_PREFIX}/fix-script-order.js"></script>`;
  const injectSync = `<script src="${SYNC_PREFIX}/client-sync.js"></script>`;
  
  if (html.includes('</head>')) {
    html = html.replace('</head>', injectFix + '\n' + injectSync + '\n</head>');
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', injectFix + '\n' + injectSync + '\n</body>');
  } else {
    html = injectFix + '\n' + injectSync + '\n' + html;
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
