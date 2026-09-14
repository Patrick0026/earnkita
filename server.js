const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// MONGODB CONNECTION
// ================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is missing.');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

let database;

// ================================
// MIDDLEWARE
// ================================
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

// ================================
// CONNECT TO MONGODB
// ================================
async function connectDatabase() {
  try {
    await client.connect();

    database = client.db('earnkita');

    console.log('Connected to MongoDB successfully.');

    // Create collections if they don't exist
    const existingCollections = await database
      .listCollections()
      .toArray();

    const collectionNames = existingCollections.map(c => c.name);

    const requiredCollections = [
      'users',
      'jobs',
      'chats',
      'reports'
    ];

    for (const name of requiredCollections) {
      if (!collectionNames.includes(name)) {
        await database.createCollection(name);
      }
    }

    console.log('EarnKita database ready.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

// ================================
// GET DATA
// ================================
app.get('/api/:collection', async (req, res) => {
  try {
    const collectionName = req.params.collection;

    const allowedCollections = [
      'users',
      'jobs',
      'chats',
      'reports'
    ];

    if (!allowedCollections.includes(collectionName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid collection'
      });
    }

    const collection = database.collection(collectionName);

    const data = await collection
      .find({})
      .toArray();

    // Remove MongoDB's internal _id before sending to frontend
    const cleanData = data.map(item => {
      const { _id, ...rest } = item;
      return rest;
    });

    res.json(cleanData);

  } catch (error) {
    console.error(`GET /api/${req.params.collection} error:`, error);

    res.status(500).json({
      success: false,
      error: 'Failed to load data'
    });
  }
});

// ================================
// SAVE / REPLACE COLLECTION
// ================================
app.post('/api/:collection', async (req, res) => {
  try {
    const collectionName = req.params.collection;
    const data = req.body;

    const allowedCollections = [
      'users',
      'jobs',
      'chats',
      'reports'
    ];

    if (!allowedCollections.includes(collectionName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid collection'
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Data must be an array'
      });
    }

    const collection = database.collection(collectionName);

    // Remove existing documents
    await collection.deleteMany({});

    // Insert new data
    if (data.length > 0) {
      await collection.insertMany(data);
    }

    res.json({
      success: true,
      count: data.length
    });

  } catch (error) {
    console.error(`POST /api/${req.params.collection} error:`, error);

    res.status(500).json({
      success: false,
      error: 'Failed to save data'
    });
  }
});

// ================================
// HEALTH CHECK
// ================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EarnKita server is running'
  });
});

// ================================
// START SERVER
// ================================
async function startServer() {
  await connectDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EarnKita server running on port ${PORT}`);
  });
}

startServer();