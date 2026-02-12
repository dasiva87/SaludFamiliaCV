
const express = require('express');
const path = require('path');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Asegurar que la carpeta /data existe para el volumen de Railway
const dbFolder = '/data';
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
}

// Inicializar base de datos
const db = new Database(path.join(dbFolder, 'database.sqlite'));

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    createdAt TEXT,
    data TEXT
  )
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(__dirname));

// API: Obtener todos los registros
app.get('/api/records', (req, res) => {
  try {
    const rows = db.prepare('SELECT data FROM records ORDER BY createdAt DESC').all();
    const records = rows.map(row => JSON.parse(row.data));
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Guardar o actualizar registro
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

// API: Eliminar registro
app.delete('/api/records/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Todas las demás rutas sirven el index.html (para que React maneje el routing si fuera necesario)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Base de datos lista en ${path.join(dbFolder, 'database.sqlite')}`);
});
