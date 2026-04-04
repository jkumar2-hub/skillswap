const express = require('express');
const router = express.Router();
const { query, getOne, getAll } = require('../db/database');
const { auth } = require('../middleware/auth');
const socketManager = require('../socketManager');

router.get('/conversations', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const conversations = await getAll(`
      SELECT DISTINCT ON (other_id)
        other_id,
        u.name,
        u.avatar,
        m.content as last_message,
        m.created_at,
        (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND sender_id=other_id AND is_read=false) as unread
      FROM (
        SELECT CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END as other_id,
               content, created_at
        FROM messages WHERE sender_id=$1 OR receiver_id=$1
        ORDER BY created_at DESC
      ) m
      JOIN users u ON u.id = m.other_id
      ORDER BY other_id, m.created_at DESC
    `, [uid]);
    res.json(conversations.map(c => ({ ...c, other_user_id: c.other_id })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/notifications/all', auth, async (req, res) => {
  try {
    const notifs = await getAll(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/notifications/read', auth, async (req, res) => {
  await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
  res.json({ success: true });
});

router.get('/notifications/unread-count', auth, async (req, res) => {
  const result = await getOne(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id=$1 AND is_read=false',
    [req.user.id]
  );
  res.json({ count: parseInt(result.count) });
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await getAll(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id=$1 AND m.receiver_id=$2)
         OR (m.sender_id=$2 AND m.receiver_id=$1)
      ORDER BY m.created_at ASC
    `, [req.user.id, req.params.userId]);

    await query(
      'UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2',
      [req.params.userId, req.user.id]
    );
    res.json(messages);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const result = await getOne(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, receiver_id, content.trim()]
    );

    const message = await getOne(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [result.id]);

    // ✅ Emit real-time message to receiver
    socketManager.emitToUser(receiver_id, 'message:new', message);

    res.json(message);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
