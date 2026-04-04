const express = require('express');
const router = express.Router();
const { query, getOne, getAll } = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const exchanges = await getAll(`
      SELECT e.*,
        r.name as requester_name, r.avatar as requester_avatar,
        rc.name as receiver_name, rc.avatar as receiver_avatar
      FROM exchanges e
      JOIN users r ON e.requester_id = r.id
      JOIN users rc ON e.receiver_id = rc.id
      WHERE e.requester_id = $1 OR e.receiver_id = $1
      ORDER BY e.created_at DESC
    `, [req.user.id]);
    res.json(exchanges);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { receiver_id, offer_skill, want_skill, message, scheduled_at, session_type } = req.body;
    if (!receiver_id || !offer_skill || !want_skill) return res.status(400).json({ error: 'Missing fields' });

    const result = await getOne(`
      INSERT INTO exchanges (requester_id, receiver_id, offer_skill, want_skill, message, scheduled_at, session_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
    `, [req.user.id, receiver_id, offer_skill, want_skill, message || '', scheduled_at || null, session_type || 'online']);

    await query(`
      INSERT INTO notifications (user_id, type, message, related_id)
      VALUES ($1, 'exchange_request', $2, $3)
    `, [receiver_id, `${req.user.name} wants to exchange skills with you!`, result.id]);

    res.json({ id: result.id, status: 'pending' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const exchange = await getOne('SELECT * FROM exchanges WHERE id = $1', [req.params.id]);
    if (!exchange) return res.status(404).json({ error: 'Exchange not found' });
    if (exchange.receiver_id !== req.user.id && exchange.requester_id !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    await query('UPDATE exchanges SET status=$1, updated_at=NOW() WHERE id=$2', [status, req.params.id]);

    const notifyUser = exchange.receiver_id === req.user.id ? exchange.requester_id : exchange.receiver_id;
    await query('INSERT INTO notifications (user_id, type, message, related_id) VALUES ($1,$2,$3,$4)',
      [notifyUser, 'exchange_update', `Your exchange request was ${status}`, exchange.id]);

    res.json({ success: true, status });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const exchange = await getOne('SELECT * FROM exchanges WHERE id = $1', [req.params.id]);
    if (!exchange || exchange.status !== 'completed')
      return res.status(400).json({ error: 'Exchange not completed' });

    const reviewee_id = exchange.requester_id === req.user.id ? exchange.receiver_id : exchange.requester_id;

    const existing = await getOne('SELECT id FROM reviews WHERE exchange_id=$1 AND reviewer_id=$2', [req.params.id, req.user.id]);
    if (existing) return res.status(400).json({ error: 'Already reviewed' });

    await query('INSERT INTO reviews (exchange_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, req.user.id, reviewee_id, rating, comment || '']);

    const stats = await getOne('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewee_id = $1', [reviewee_id]);
    await query('UPDATE users SET rating=$1, total_reviews=$2 WHERE id=$3',
      [Math.round(parseFloat(stats.avg) * 10) / 10, parseInt(stats.count), reviewee_id]);

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
