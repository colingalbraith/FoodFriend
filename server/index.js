import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FOODS as seedData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize database
const db = new Database(join(__dirname, 'foods.db'));

// Create foods table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    expiry_days INTEGER,
    calories INTEGER,
    protein REAL,
    carbs REAL,
    fat REAL,
    serving TEXT
  );
`);

// Create FTS5 virtual table for fast prefix searching
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
    name,
    content=foods,
    content_rowid=id
  );
`);

// Seed database if empty
const count = db.prepare('SELECT COUNT(*) as count FROM foods').get();
if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO foods (name, category, expiry_days, calories, protein, carbs, fat, serving)
    VALUES (@name, @category, @expiry_days, @calories, @protein, @carbs, @fat, @serving)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      const row = insert.run(item);
      db.prepare(`INSERT INTO foods_fts(rowid, name) VALUES (?, ?)`).run(row.lastInsertRowid, item.name);
    }
  });

  insertMany(seedData);
  console.log(`Seeded database with ${seedData.length} food items.`);
}

// GET /api/foods?q=searchterm
app.get('/api/foods', (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    const rows = db.prepare('SELECT * FROM foods LIMIT 30').all();
    return res.json(rows);
  }

  const term = q.trim();

  // Try FTS5 prefix search first
  let rows = db
    .prepare(`
      SELECT foods.* FROM foods
      JOIN foods_fts ON foods.id = foods_fts.rowid
      WHERE foods_fts MATCH ?
      LIMIT 30
    `)
    .all(`${term}*`);

  // Fall back to LIKE substring search if FTS returns nothing
  if (rows.length === 0) {
    rows = db
      .prepare(`SELECT * FROM foods WHERE name LIKE ? LIMIT 30`)
      .all(`%${term}%`);
  }

  res.json(rows);
});

// GET /api/foods/categories
app.get('/api/foods/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM foods ORDER BY category').all();
  res.json(rows.map((r) => r.category));
});

// GET /api/foods/:id
app.get('/api/foods/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM foods WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ error: 'Food item not found' });
  }
  res.json(row);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Food database API server running on http://0.0.0.0:${PORT}`);
});
