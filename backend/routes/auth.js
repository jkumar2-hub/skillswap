const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getOne, pool } = require('../db/database');
const { auth, JWT_SECRET } = require('../middleware/auth');

// ── Register ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await getOne(
      'INSERT INTO users (name, email, password, location) VALUES ($1,$2,$3,$4) RETURNING id',
      [name, email, hash, location || '']
    );
    const token = jwt.sign({ id: result.id, email, name }, JWT_SECRET, { expiresIn: '7d' });
    const user = await getOne(
      'SELECT id, name, email, bio, location, avatar, rating, total_reviews FROM users WHERE id = $1',
      [result.id]
    );
    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get current user ──
router.get('/me', auth, async (req, res) => {
  try {
    const user = await getOne(
      'SELECT id, name, email, bio, location, avatar, rating, total_reviews FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update profile ──
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, location } = req.body;
    await query(
      'UPDATE users SET name=$1, bio=$2, location=$3 WHERE id=$4',
      [name, bio, location, req.user.id]
    );
    const user = await getOne(
      'SELECT id, name, email, bio, location, avatar, rating, total_reviews FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Seed demo accounts (protected by SEED_SECRET header) ──
router.post('/seed', async (req, res) => {
  if (req.headers['x-seed-secret'] !== process.env.SEED_SECRET)
    return res.status(403).json({ error: 'Forbidden' });
  try {
    const users = [
      { name: 'Demo User',    email: 'demo@skillswap.com',  pw: 'demo1234', loc: 'Mumbai, India',    bio: 'Tech enthusiast who loves learning and sharing knowledge.' },
      { name: 'Priya Sharma', email: 'priya@example.com',   pw: 'password', loc: 'Pune, India',      bio: 'Music teacher and aspiring programmer.' },
      { name: 'Rahul Verma',  email: 'rahul@example.com',   pw: 'password', loc: 'Delhi, India',     bio: 'Chef by passion, engineer by degree.' },
      { name: 'Ananya Patel', email: 'ananya@example.com',  pw: 'password', loc: 'Bangalore, India', bio: 'UX designer with a love for languages and travel.' },
      { name: 'Karthik Nair', email: 'karthik@example.com', pw: 'password', loc: 'Chennai, India',   bio: 'Fitness trainer and math tutor.' },
    ];
    const ids = {};
    for (const u of users) {
      const hash = bcrypt.hashSync(u.pw, 10);
      const r = await pool.query(
        'INSERT INTO users (name,email,password,location,bio) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password, name=EXCLUDED.name, bio=EXCLUDED.bio RETURNING id',
        [u.name, u.email, hash, u.loc, u.bio]
      );
      ids[u.email] = r.rows[0].id;
    }

    // Clear existing skills for these users to avoid duplicates
    await pool.query(
      `DELETE FROM user_skills_offer WHERE user_id IN (${Object.values(ids).join(',')})`
    );
    await pool.query(
      `DELETE FROM user_skills_want WHERE user_id IN (${Object.values(ids).join(',')})`
    );

    const offers = [
      ['demo@skillswap.com',  'Python',          'Technology',      'Expert',       'Python from basics to Django'],
      ['demo@skillswap.com',  'Data Analysis',   'Technology',      'Intermediate', 'Pandas, NumPy, visualization'],
      ['priya@example.com',   'Guitar',          'Music',           'Expert',       'Classical and modern guitar'],
      ['priya@example.com',   'Piano',           'Music',           'Intermediate', 'Classical pieces and music theory'],
      ['rahul@example.com',   'Cooking',         'Cooking',         'Expert',       'Indian, Italian, and fusion cuisines'],
      ['rahul@example.com',   'Baking',          'Cooking',         'Expert',       'Bread, cakes, pastries'],
      ['ananya@example.com',  'UI/UX Design',    'Arts & Design',   'Expert',       'Figma, user research, design systems'],
      ['ananya@example.com',  'Spanish',         'Languages',       'Intermediate', 'Conversational Spanish'],
      ['karthik@example.com', 'Fitness Training','Sports & Fitness','Expert',       'Weight training, HIIT, nutrition'],
      ['karthik@example.com', 'Mathematics',     'Academic',        'Expert',       'Calculus, Linear Algebra, Statistics'],
    ];
    for (const [email, skill, cat, prof, desc] of offers) {
      await pool.query(
        'INSERT INTO user_skills_offer (user_id,skill_name,category,proficiency,description) VALUES ($1,$2,$3,$4,$5)',
        [ids[email], skill, cat, prof, desc]
      );
    }

    const wants = [
      ['demo@skillswap.com',  'Guitar',          'Music'],
      ['demo@skillswap.com',  'Spanish',         'Languages'],
      ['priya@example.com',   'Python',          'Technology'],
      ['priya@example.com',   'Photography',     'Photography'],
      ['rahul@example.com',   'UI/UX Design',    'Arts & Design'],
      ['rahul@example.com',   'Fitness Training','Sports & Fitness'],
      ['ananya@example.com',  'Python',          'Technology'],
      ['ananya@example.com',  'Fitness Training','Sports & Fitness'],
      ['karthik@example.com', 'Cooking',         'Cooking'],
      ['karthik@example.com', 'Spanish',         'Languages'],
    ];
    for (const [email, skill, cat] of wants) {
      await pool.query(
        'INSERT INTO user_skills_want (user_id,skill_name,category) VALUES ($1,$2,$3)',
        [ids[email], skill, cat]
      );
    }

    res.json({ success: true, message: `Seeded ${Object.keys(ids).length} demo users!` });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Fix duplicates (cleans & re-seeds skills only) ──
router.post('/fix-duplicates', async (req, res) => {
  if (req.headers['x-seed-secret'] !== process.env.SEED_SECRET)
    return res.status(403).json({ error: 'Forbidden' });
  try {
    const emails = ['demo@skillswap.com','priya@example.com','rahul@example.com','ananya@example.com','karthik@example.com'];
    const { rows } = await pool.query(
      `SELECT id, email FROM users WHERE email = ANY($1)`, [emails]
    );
    if (!rows.length) return res.status(404).json({ error: 'No demo users found. Run /seed first.' });

    const ids = {};
    rows.forEach(r => { ids[r.email] = r.id; });
    const idList = Object.values(ids).join(',');

    await pool.query(`DELETE FROM user_skills_offer WHERE user_id IN (${idList})`);
    await pool.query(`DELETE FROM user_skills_want WHERE user_id IN (${idList})`);

    const offers = [
      ['demo@skillswap.com',  'Python',          'Technology',      'Expert',       'Python from basics to Django'],
      ['demo@skillswap.com',  'Data Analysis',   'Technology',      'Intermediate', 'Pandas, NumPy, visualization'],
      ['priya@example.com',   'Guitar',          'Music',           'Expert',       'Classical and modern guitar'],
      ['priya@example.com',   'Piano',           'Music',           'Intermediate', 'Classical pieces and music theory'],
      ['rahul@example.com',   'Cooking',         'Cooking',         'Expert',       'Indian, Italian, and fusion cuisines'],
      ['rahul@example.com',   'Baking',          'Cooking',         'Expert',       'Bread, cakes, pastries'],
      ['ananya@example.com',  'UI/UX Design',    'Arts & Design',   'Expert',       'Figma, user research, design systems'],
      ['ananya@example.com',  'Spanish',         'Languages',       'Intermediate', 'Conversational Spanish'],
      ['karthik@example.com', 'Fitness Training','Sports & Fitness','Expert',       'Weight training, HIIT, nutrition'],
      ['karthik@example.com', 'Mathematics',     'Academic',        'Expert',       'Calculus, Linear Algebra, Statistics'],
    ];
    for (const [email, skill, cat, prof, desc] of offers) {
      if (!ids[email]) continue;
      await pool.query(
        'INSERT INTO user_skills_offer (user_id,skill_name,category,proficiency,description) VALUES ($1,$2,$3,$4,$5)',
        [ids[email], skill, cat, prof, desc]
      );
    }

    const wants = [
      ['demo@skillswap.com',  'Guitar',          'Music'],
      ['demo@skillswap.com',  'Spanish',         'Languages'],
      ['priya@example.com',   'Python',          'Technology'],
      ['priya@example.com',   'Photography',     'Photography'],
      ['rahul@example.com',   'UI/UX Design',    'Arts & Design'],
      ['rahul@example.com',   'Fitness Training','Sports & Fitness'],
      ['ananya@example.com',  'Python',          'Technology'],
      ['ananya@example.com',  'Fitness Training','Sports & Fitness'],
      ['karthik@example.com', 'Cooking',         'Cooking'],
      ['karthik@example.com', 'Spanish',         'Languages'],
    ];
    for (const [email, skill, cat] of wants) {
      if (!ids[email]) continue;
      await pool.query(
        'INSERT INTO user_skills_want (user_id,skill_name,category) VALUES ($1,$2,$3)',
        [ids[email], skill, cat]
      );
    }

    res.json({ success: true, message: 'Duplicates fixed — skills re-seeded cleanly!' });
  } catch (err) {
    console.error('Fix-duplicates error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Delete demo accounts ──
router.post('/delete-demo', async (req, res) => {
  if (req.headers['x-seed-secret'] !== process.env.SEED_SECRET)
    return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE email IN ('demo@skillswap.com','priya@example.com','rahul@example.com','ananya@example.com','karthik@example.com')`
    );
    res.json({ success: true, message: `Deleted ${result.rowCount} demo accounts.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
