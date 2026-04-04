require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'skillexchange',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      }
);

// Convenience: run a query
const query = (text, params) => pool.query(text, params);

// Convenience: get a single row
const getOne = async (text, params) => {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
};

// Convenience: get all rows
const getAll = async (text, params) => {
  const res = await pool.query(text, params);
  return res.rows;
};

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT DEFAULT '',
      location TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      rating NUMERIC(3,1) DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS skill_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_skills_offer (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_name TEXT NOT NULL,
      category TEXT NOT NULL,
      proficiency TEXT DEFAULT 'Intermediate',
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS user_skills_want (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_name TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      offer_skill TEXT NOT NULL,
      want_skill TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      message TEXT DEFAULT '',
      scheduled_at TIMESTAMPTZ,
      session_type TEXT DEFAULT 'online',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      exchange_id INTEGER NOT NULL REFERENCES exchanges(id),
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      reviewee_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      related_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed categories if empty
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM skill_categories');
  if (parseInt(rows[0].c) === 0) {
    const cats = [
      ['Technology','💻'], ['Music','🎵'], ['Languages','🌍'],
      ['Arts & Design','🎨'], ['Sports & Fitness','🏋️'], ['Cooking','🍳'],
      ['Business','💼'], ['Academic','📚'], ['Photography','📷'], ['Other','✨'],
    ];
    for (const [name, icon] of cats) {
      await pool.query('INSERT INTO skill_categories (name, icon) VALUES ($1, $2)', [name, icon]);
    }
  }

  console.log('✅ PostgreSQL database initialized');
};

module.exports = { pool, query, getOne, getAll, init };
