const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'bosani',
  database: 'bosani_nps',
  connectionLimit: 5
});

app.get('/api/nps/:account', async (req, res) => {
  const account = req.params.account;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM nps_score_tab WHERE instagram_account = ?',
      [account]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/nps', async (req, res) => {
  const { instagram_account, score, feedback } = req.body;

  if (!instagram_account || score === undefined) {
    return res.status(400).json({ error: 'instagram_account and score are required' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO nps_score_tab (instagram_account, score, feedback) VALUES (?, ?, ?)',
      [instagram_account, score, feedback || null]
    );
    res.status(201).json({
      message: 'Score created',
      id: Number(result.insertId)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to insert score' });
  } finally {
    if (conn) conn.release();
  }
});

app.put('/api/nps/:id', async (req, res) => {
  const id = req.params.id;
  const { score, feedback } = req.body;

  if (score === undefined) {
    return res.status(400).json({ error: 'score is required' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'UPDATE nps_score_tab SET score = ?, feedback = ? WHERE id = ?',
      [score, feedback || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Score not found' });
    }
    res.json({ message: 'Score updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update score' });
  } finally {
    if (conn) conn.release();
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
