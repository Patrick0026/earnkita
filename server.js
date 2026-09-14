const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(express.json());
app.use(express.static(__dirname));

// Read database
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      jobs: [],
      chats: [],
      reports: [],
      sessions: {}
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }

  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Write database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// GET data
app.get('/api/:collection', (req, res) => {
  const db = readDB();
  const collection = req.params.collection;

  res.json(db[collection] || []);
});

// SAVE data
app.post('/api/:collection', (req, res) => {
  const db = readDB();
  const collection = req.params.collection;

  if (!db[collection]) {
    db[collection] = [];
  }

  db[collection] = req.body;

  writeDB(db);

  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`EarnKita server running on port ${PORT}`);
});
