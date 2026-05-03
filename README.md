# 📚 Vocabulary Master

A beautiful, fully offline-capable vocabulary manager with CRUD operations.

## Project Structure

```
vocab-app/
├── index.html    ← Frontend (open directly OR serve via Node)
├── server.js     ← Node.js backend (REST API)
├── db.json       ← JSON database (auto-updated by server)
└── README.md
```

## Getting Started

### Option A — With Node.js server (full CRUD)
```bash
node server.js
# Open: http://localhost:3000
```

### Option B — Open directly in browser (read-only)
Just open `index.html` in your browser. CRUD will show errors since there's no server, but browsing works.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/categories | List all categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category name |
| DELETE | /api/categories/:id | Delete category + words |
| GET | /api/categories/:id | Get single category |
| POST | /api/categories/:id/words | Add word |
| PUT | /api/categories/:id/words/:wid | Update word |
| DELETE | /api/categories/:id/words/:wid | Delete word |

## Features
- 📂 15 vocabulary categories in card view
- 🔍 Search categories and words
- ✏️ Add / Edit / Delete categories and words
- 💾 All changes saved live to `db.json`
- 🌟 Highlights misspellings (as_written ≠ correct_spelling)
- 📱 Responsive design
