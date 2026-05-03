const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DB_PATH = path.join(__dirname, 'db.json');
const PORT = 3000;

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function genId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── API routes ──────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {

    // GET all categories
    if (req.method === 'GET' && pathname === '/api/categories') {
      const db = readDB();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(db.categories));
    }

    // GET single category
    const catMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);
    if (req.method === 'GET' && catMatch) {
      const db = readDB();
      const cat = db.categories.find(c => c.id === catMatch[1]);
      if (!cat) { res.writeHead(404); return res.end(JSON.stringify({ error: 'Not found' })); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(cat));
    }

    // POST new category
    if (req.method === 'POST' && pathname === '/api/categories') {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', () => {
        const { name } = JSON.parse(body);
        const db = readDB();
        const newCat = { id: genId('cat_'), name, words: [] };
        db.categories.push(newCat);
        writeDB(db);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newCat));
      });
      return;
    }

    // PUT update category name
    if (req.method === 'PUT' && catMatch) {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', () => {
        const { name } = JSON.parse(body);
        const db = readDB();
        const cat = db.categories.find(c => c.id === catMatch[1]);
        if (!cat) { res.writeHead(404); return res.end(JSON.stringify({ error: 'Not found' })); }
        cat.name = name;
        writeDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cat));
      });
      return;
    }

    // DELETE category
    if (req.method === 'DELETE' && catMatch) {
      const db = readDB();
      db.categories = db.categories.filter(c => c.id !== catMatch[1]);
      writeDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    }

    // POST new word
    const wordsMatch = pathname.match(/^\/api\/categories\/([^/]+)\/words$/);
    if (req.method === 'POST' && wordsMatch) {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', () => {
        const { as_written, correct_spelling, definition } = JSON.parse(body);
        const db = readDB();
        const cat = db.categories.find(c => c.id === wordsMatch[1]);
        if (!cat) { res.writeHead(404); return res.end(JSON.stringify({ error: 'Not found' })); }
        const newWord = { id: genId('w_'), as_written, correct_spelling, definition };
        cat.words.push(newWord);
        writeDB(db);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newWord));
      });
      return;
    }

    // PUT update word
    const wordMatch = pathname.match(/^\/api\/categories\/([^/]+)\/words\/([^/]+)$/);
    if (req.method === 'PUT' && wordMatch) {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', () => {
        const updates = JSON.parse(body);
        const db = readDB();
        const cat = db.categories.find(c => c.id === wordMatch[1]);
        if (!cat) { res.writeHead(404); return res.end(JSON.stringify({ error: 'Not found' })); }
        const word = cat.words.find(w => w.id === wordMatch[2]);
        if (!word) { res.writeHead(404); return res.end(JSON.stringify({ error: 'Not found' })); }
        Object.assign(word, updates);
        writeDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(word));
      });
      return;
    }

    // DELETE word
    if (req.method === 'DELETE' && wordMatch) {
      const db = readDB();
      const cat = db.categories.find(c => c.id === wordMatch[1]);
      if (!cat) { res.writeHead(404); return res.end(JSON.stringify({ error: 'Not found' })); }
      cat.words = cat.words.filter(w => w.id !== wordMatch[2]);
      writeDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    }

    res.writeHead(404);
    return res.end(JSON.stringify({ error: 'Route not found' }));
  }

  // ── Static files ────────────────────────────────────────────
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅  Vocabulary app running at http://localhost:${PORT}`);
});