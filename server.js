
const express = require('express');
const path = require('path');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const esbuild = require('esbuild');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de persistencia para Railway
const dbFolder = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
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

// MIDDLEWARE DE TRANSPILACIÓN: Resuelve el error de MIME type y transpila TSX/TS
app.use((req, res, next) => {
  // Ignorar peticiones a la API
  if (req.path.startsWith('/api')) return next();

  let ext = path.extname(req.path);
  let filePath = path.join(__dirname, req.path);

  // Si no tiene extensión (ej: import ./App), intentamos resolver .tsx o .ts
  if (!ext) {
    if (fs.existsSync(filePath + '.tsx')) {
      filePath += '.tsx';
      ext = '.tsx';
    } else if (fs.existsSync(filePath + '.ts')) {
      filePath += '.ts';
      ext = '.ts';
    }
  }

  // Si es un archivo de código TypeScript/React
  if (ext === '.tsx' || ext === '.ts') {
    if (!fs.existsSync(filePath)) return next();

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = esbuild.transformSync(content, {
        loader: ext.slice(1),
        format: 'esm',
        target: 'es2020',
        sourcemap: 'inline'
      });
      
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.send(result.code);
    } catch (err) {
      console.error(`Error transpilando ${filePath}:`, err);
      return res.status(500).send(err.message);
    }
  }
  next();
});

// Servir archivos estáticos después del transpilador
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

// Redirigir todas las demás rutas al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📁 Base de datos en: ${path.join(dbFolder, 'database.sqlite')}`);
});
