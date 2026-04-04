require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, init } = require('./db/database');

const run = async () => {
  await init();

  const users = [
    { name: 'Demo User',    email: 'demo@skillswap.com',   password: 'demo1234', location: 'Mumbai, India',    bio: 'Tech enthusiast who loves learning and sharing knowledge.' },
    { name: 'Priya Sharma', email: 'priya@example.com',    password: 'password', location: 'Pune, India',      bio: 'Music teacher and aspiring programmer.' },
    { name: 'Rahul Verma',  email: 'rahul@example.com',    password: 'password', location: 'Delhi, India',     bio: 'Chef by passion, engineer by degree.' },
    { name: 'Ananya Patel', email: 'ananya@example.com',   password: 'password', location: 'Bangalore, India', bio: 'UX designer with a love for languages and travel.' },
    { name: 'Karthik Nair', email: 'karthik@example.com',  password: 'password', location: 'Chennai, India',   bio: 'Fitness trainer and math tutor.' },
  ];

  const insertedIds = [];
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    const res = await pool.query(
      'INSERT INTO users (name, email, password, location, bio) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id',
      [u.name, u.email, hash, u.location, u.bio]
    );
    insertedIds.push(res.rows[0].id);
  }

  const offerSkills = [
    [0, 'Python',          'Technology',     'Expert',       'Python from basics to Django'],
    [0, 'Data Analysis',   'Technology',     'Intermediate', 'Pandas, NumPy, and visualization'],
    [1, 'Guitar',          'Music',          'Expert',       'Classical and modern guitar'],
    [1, 'Piano',           'Music',          'Intermediate', 'Classical pieces and music theory'],
    [2, 'Cooking',         'Cooking',        'Expert',       'Indian, Italian, and fusion cuisines'],
    [2, 'Baking',          'Cooking',        'Expert',       'Bread, cakes, pastries'],
    [3, 'UI/UX Design',    'Arts & Design',  'Expert',       'Figma, user research, design systems'],
    [3, 'Spanish',         'Languages',      'Intermediate', 'Conversational Spanish for beginners'],
    [4, 'Fitness Training','Sports & Fitness','Expert',      'Weight training, HIIT, nutrition'],
    [4, 'Mathematics',     'Academic',       'Expert',       'Calculus, Linear Algebra, Statistics'],
  ];

  const wantSkills = [
    [0, 'Guitar',          'Music'],
    [0, 'Spanish',         'Languages'],
    [1, 'Python',          'Technology'],
    [1, 'Photography',     'Photography'],
    [2, 'UI/UX Design',    'Arts & Design'],
    [2, 'Fitness Training','Sports & Fitness'],
    [3, 'Python',          'Technology'],
    [3, 'Fitness Training','Sports & Fitness'],
    [4, 'Cooking',         'Cooking'],
    [4, 'Spanish',         'Languages'],
  ];

  for (const [idx, skill, cat, prof, desc] of offerSkills) {
    const uid = insertedIds[idx];
    await pool.query(
      'INSERT INTO user_skills_offer (user_id, skill_name, category, proficiency, description) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
      [uid, skill, cat, prof, desc]
    );
  }

  for (const [idx, skill, cat] of wantSkills) {
    const uid = insertedIds[idx];
    await pool.query(
      'INSERT INTO user_skills_want (user_id, skill_name, category) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [uid, skill, cat]
    );
  }

  console.log('✅ Seeded demo data!');
  console.log('   demo@skillswap.com / demo1234');
  await pool.end();
};

run().catch(err => { console.error(err); process.exit(1); });
