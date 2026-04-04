const express = require('express');
const router = express.Router();
const { getOne, getAll } = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/me/stats', auth, async (req, res) => {
  try {
    const exchanges = await getAll(
      'SELECT status, COUNT(*) as count FROM exchanges WHERE requester_id=$1 OR receiver_id=$1 GROUP BY status',
      [req.user.id]
    );
    const messages = await getOne('SELECT COUNT(*) as count FROM messages WHERE receiver_id=$1 AND is_read=false', [req.user.id]);
    const pending = await getOne('SELECT COUNT(*) as count FROM exchanges WHERE receiver_id=$1 AND status=$2', [req.user.id, 'pending']);
    res.json({ exchanges, unread_messages: parseInt(messages.count), pending_requests: parseInt(pending.count) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await getOne(
      'SELECT id, name, email, bio, location, avatar, rating, total_reviews, created_at FROM users WHERE id=$1',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const offer = await getAll('SELECT * FROM user_skills_offer WHERE user_id=$1', [user.id]);
    const want = await getAll('SELECT * FROM user_skills_want WHERE user_id=$1', [user.id]);
    const reviews = await getAll(`
      SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
      FROM reviews r JOIN users u ON r.reviewer_id=u.id
      WHERE r.reviewee_id=$1 ORDER BY r.created_at DESC LIMIT 10
    `, [user.id]);

    res.json({ ...user, offer, want, reviews });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
