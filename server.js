
const express = require('express');
const path = require('path');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const esbuild = require('esbuild');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de persistencia para Railway
const dbFolder = process.env.RAILWAY_VOLUME_MOUNT_PATH || './data';
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
}

const db = new Database(path.join(dbFolder, 'database.sqlite'));
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    createdAt TEXT,
    data TEXT
  )
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MIDDLEWARE CRÍTICO: Transpila archivos .tsx y .ts en tiempo real
app.get(/\.(tsx|ts)$/, (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

  try {
    const tsxCode = fs.readFileSync(filePath, 'utf8');
    const result = esbuild.transformSync(tsxCode, {
      loader: req.path.endsWith('.tsx') ? 'tsx' : 'ts',
      format: 'esm',
      target: 'es2020',
    });
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(result.code);
  } catch (err) {
    console.error('Error transpilando:', err);
    res.status(500).send(err.message);
  }
});

// Servir archivos estáticos (HTML, CSS, imágenes)
app.use(express.static(__dirname));

// API Routes
app.get('/api/records', (req, res) => {
  try {
    const rows = db.prepare('SELECT data FROM records ORDER BY createdAt DESC').all();
    res.json(rows.map(row => JSON.parse(row.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', (req, res) => {
  const record = req.body;
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO records (id, createdAt, data) VALUES (?, ?, ?)');
    stmt.run(record.id, record.createdAt, JSON.stringify(record));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/records/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
  console.log(`📁 BD en: ${path.join(dbFolder, 'database.sqlite')}`);
});
