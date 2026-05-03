const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DB_PATH = path.join(process.cwd(), 'db.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadInitialDB() {
  if (!globalThis.__WORD_LIST_DB) {
    globalThis.__WORD_LIST_DB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }

  return globalThis.__WORD_LIST_DB;
}

function readDB() {
  return clone(loadInitialDB());
}

function writeDB(data) {
  globalThis.__WORD_LIST_DB = clone(data);
}

function genId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === 'string') {
    return Promise.resolve(req.body ? JSON.parse(req.body) : {});
  }

  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  const parsed = new URL(req.url, 'https://word-list.vercel.app');
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && pathname === '/api/categories') {
      const db = readDB();
      send(res, 200, db.categories);
      return;
    }

    const catMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);

    if (req.method === 'GET' && catMatch) {
      const db = readDB();
      const cat = db.categories.find(c => c.id === catMatch[1]);

      if (!cat) {
        send(res, 404, { error: 'Not found' });
        return;
      }

      send(res, 200, cat);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/categories') {
      const { name } = await readBody(req);

      if (!name || !name.trim()) {
        send(res, 400, { error: 'Name is required' });
        return;
      }

      const db = readDB();
      const newCat = { id: genId('cat_'), name: name.trim(), words: [] };
      db.categories.push(newCat);
      writeDB(db);
      send(res, 201, newCat);
      return;
    }

    if (req.method === 'PUT' && catMatch) {
      const { name } = await readBody(req);
      const db = readDB();
      const cat = db.categories.find(c => c.id === catMatch[1]);

      if (!cat) {
        send(res, 404, { error: 'Not found' });
        return;
      }

      if (!name || !name.trim()) {
        send(res, 400, { error: 'Name is required' });
        return;
      }

      cat.name = name.trim();
      writeDB(db);
      send(res, 200, cat);
      return;
    }

    if (req.method === 'DELETE' && catMatch) {
      const db = readDB();
      db.categories = db.categories.filter(c => c.id !== catMatch[1]);
      writeDB(db);
      send(res, 200, { success: true });
      return;
    }

    const wordsMatch = pathname.match(/^\/api\/categories\/([^/]+)\/words$/);

    if (req.method === 'POST' && wordsMatch) {
      const { as_written, correct_spelling, definition } = await readBody(req);
      const db = readDB();
      const cat = db.categories.find(c => c.id === wordsMatch[1]);

      if (!cat) {
        send(res, 404, { error: 'Not found' });
        return;
      }

      const newWord = {
        id: genId('w_'),
        as_written: as_written || '',
        correct_spelling: correct_spelling || '',
        definition: definition || '',
      };

      cat.words.push(newWord);
      writeDB(db);
      send(res, 201, newWord);
      return;
    }

    const wordMatch = pathname.match(/^\/api\/categories\/([^/]+)\/words\/([^/]+)$/);

    if (req.method === 'PUT' && wordMatch) {
      const updates = await readBody(req);
      const db = readDB();
      const cat = db.categories.find(c => c.id === wordMatch[1]);

      if (!cat) {
        send(res, 404, { error: 'Not found' });
        return;
      }

      const word = cat.words.find(w => w.id === wordMatch[2]);

      if (!word) {
        send(res, 404, { error: 'Not found' });
        return;
      }

      Object.assign(word, updates);
      writeDB(db);
      send(res, 200, word);
      return;
    }

    if (req.method === 'DELETE' && wordMatch) {
      const db = readDB();
      const cat = db.categories.find(c => c.id === wordMatch[1]);

      if (!cat) {
        send(res, 404, { error: 'Not found' });
        return;
      }

      cat.words = cat.words.filter(w => w.id !== wordMatch[2]);
      writeDB(db);
      send(res, 200, { success: true });
      return;
    }

    send(res, 404, { error: 'Route not found' });
  } catch (error) {
    send(res, 500, { error: error.message || 'Server error' });
  }
};
