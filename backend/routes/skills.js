const express = require('express');
const router = express.Router();
const { query, getOne, getAll } = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/categories', async (req, res) => {
  const cats = await getAll('SELECT * FROM skill_categories ORDER BY name');
  res.json(cats);
});

router.get('/my', auth, async (req, res) => {
  const offer = await getAll('SELECT * FROM user_skills_offer WHERE user_id = $1', [req.user.id]);
  const want = await getAll('SELECT * FROM user_skills_want WHERE user_id = $1', [req.user.id]);
  res.json({ offer, want });
});

router.post('/offer', auth, async (req, res) => {
  try {
    const { skill_name, category, proficiency, description } = req.body;
    if (!skill_name || !category) return res.status(400).json({ error: 'Skill name and category required' });
    const result = await getOne(
      'INSERT INTO user_skills_offer (user_id, skill_name, category, proficiency, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, skill_name, category, proficiency || 'Intermediate', description || '']
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/offer/:id', auth, async (req, res) => {
  await query('DELETE FROM user_skills_offer WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.post('/want', auth, async (req, res) => {
  try {
    const { skill_name, category } = req.body;
    if (!skill_name || !category) return res.status(400).json({ error: 'Skill name and category required' });
    const result = await getOne(
      'INSERT INTO user_skills_want (user_id, skill_name, category) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, skill_name, category]
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/want/:id', auth, async (req, res) => {
  await query('DELETE FROM user_skills_want WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.get('/browse', auth, async (req, res) => {
  try {
    const { category, search, page = 1 } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let idx = 2;

    let q = `
      SELECT DISTINCT u.id, u.name, u.bio, u.location, u.avatar, u.rating, u.total_reviews
      FROM users u
      JOIN user_skills_offer uso ON u.id = uso.user_id
      WHERE u.id != $1
    `;

    if (category) { q += ` AND uso.category = $${idx++}`; params.push(category); }
    if (search) {
      q += ` AND (uso.skill_name ILIKE $${idx} OR u.name ILIKE $${idx + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      idx += 2;
    }

    q += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const users = await getAll(q, params);

    const enriched = await Promise.all(users.map(async u => {
      const offer = await getAll('SELECT * FROM user_skills_offer WHERE user_id = $1', [u.id]);
      const want = await getAll('SELECT * FROM user_skills_want WHERE user_id = $1', [u.id]);
      return { ...u, offer, want };
    }));

    res.json(enriched);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/matches', auth, async (req, res) => {
  try {
    const myOffer = await getAll('SELECT skill_name FROM user_skills_offer WHERE user_id = $1', [req.user.id]);
    const myWant = await getAll('SELECT skill_name FROM user_skills_want WHERE user_id = $1', [req.user.id]);

    if (!myOffer.length || !myWant.length) return res.json([]);

    const offerNames = myOffer.map(s => s.skill_name);
    const wantNames = myWant.map(s => s.skill_name);

    const allUsers = await getAll(
      'SELECT id, name, bio, location, avatar, rating, total_reviews FROM users WHERE id != $1',
      [req.user.id]
    );

    const matchResults = await Promise.all(allUsers.map(async u => {
      const theirOffer = (await getAll('SELECT skill_name FROM user_skills_offer WHERE user_id = $1', [u.id])).map(s => s.skill_name);
      const theirWant = (await getAll('SELECT skill_name FROM user_skills_want WHERE user_id = $1', [u.id])).map(s => s.skill_name);

      const theyCanTeachMe = wantNames.filter(s => theirOffer.includes(s));
      const iCanTeachThem = offerNames.filter(s => theirWant.includes(s));

      if (theyCanTeachMe.length > 0 && iCanTeachThem.length > 0) {
        const offer = await getAll('SELECT * FROM user_skills_offer WHERE user_id = $1', [u.id]);
        const want = await getAll('SELECT * FROM user_skills_want WHERE user_id = $1', [u.id]);
        return { ...u, offer, want, matchScore: theyCanTeachMe.length + iCanTeachThem.length, theyCanTeachMe, iCanTeachThem };
      }
      return null;
    }));

    const matches = matchResults.filter(Boolean).sort((a, b) => b.matchScore - a.matchScore);
    res.json(matches.slice(0, 20));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
