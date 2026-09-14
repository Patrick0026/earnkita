const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

app.use(express.json());
app.use(express.static(__dirname));

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
}

// Get one collection from Supabase
async function readCollection(collection) {
  const url =
    ${SUPABASE_URL}/rest/v1/app_data +
    ?collection=eq.${encodeURIComponent(collection)} +
    &select=data;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: Bearer ${SUPABASE_KEY}
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(Supabase read error: ${errorText});
  }

  const rows = await response.json();

  if (!rows.length) {
    return collection === 'sessions' ? {} : [];
  }

  return rows[0].data;
}

// Save one collection to Supabase
async function writeCollection(collection, data) {
  const response = await fetch(
    ${SUPABASE_URL}/rest/v1/app_data?on_conflict=collection,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: Bearer ${SUPABASE_KEY},
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        collection,
        data,
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(Supabase write error: ${errorText});
  }
}

// GET collection
app.get('/api/:collection', async (req, res) => {
  try {
    const collection = req.params.collection;

    const allowedCollections = [
      'users',
      'jobs',
      'chats',
      'reports',
      'sessions'
    ];

    if (!allowedCollections.includes(collection)) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    const data = await readCollection(collection);

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to read data'
    });
  }
});

// POST collection
app.post('/api/:collection', async (req, res) => {
  try {
    const collection = req.params.collection;

    const allowedCollections = [
      'users',
      'jobs',
      'chats',
      'reports',
      'sessions'
    ];

    if (!allowedCollections.includes(collection)) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    await writeCollection(collection, req.body);

    res.json({
      success: true
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to save data'
    });
  }
});

app.listen(PORT, () => {
  console.log(`EarnKita server running on port ${PORT}`);
});
