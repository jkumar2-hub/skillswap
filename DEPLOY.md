# 🚀 SkillSwap — Deployment Guide
# Your URLs:
#   Frontend: https://skillswap-seven-sigma.vercel.app
#   Backend:  https://skillswap-backend-cie7.onrender.com

---

## STEP 1 — Push latest code to GitHub

```bash
cd skill-exchange
git add .
git commit -m "production ready"
git push
```

Render and Vercel auto-deploy on every push.

---

## STEP 2 — Render Environment Variables

Go to render.com → your backend service → Environment tab.
Make sure these are set:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| JWT_SECRET | (any long random string) |
| SEED_SECRET | skillswap2024 |
| DATABASE_URL | (auto-set by Render PostgreSQL) |
| ALLOWED_ORIGINS | https://skillswap-seven-sigma.vercel.app |

---

## STEP 3 — Vercel Environment Variables

Go to vercel.com → your project → Settings → Environment Variables.
Make sure these are set:

| Key | Value |
|-----|-------|
| VITE_API_URL | https://skillswap-backend-cie7.onrender.com/api |
| VITE_SOCKET_URL | https://skillswap-backend-cie7.onrender.com |

After adding/changing env vars on Vercel, redeploy:
Vercel → Deployments → click "Redeploy" on latest.

---

## STEP 4 — Seed demo accounts

Run in terminal (only once):
```bash
curl -X POST https://skillswap-backend-cie7.onrender.com/api/auth/seed -H "x-seed-secret: skillswap2024"
```

Demo accounts:
| Email | Password |
|-------|----------|
| demo@skillswap.com | demo1234 |
| priya@example.com | password |
| rahul@example.com | password |
| ananya@example.com | password |
| karthik@example.com | password |

---

## Useful Maintenance Commands

Fix duplicate skills (keeps accounts):
```bash
curl -X POST https://skillswap-backend-cie7.onrender.com/api/auth/fix-duplicates -H "x-seed-secret: skillswap2024"
```

Delete all demo accounts:
```bash
curl -X POST https://skillswap-backend-cie7.onrender.com/api/auth/delete-demo -H "x-seed-secret: skillswap2024"
```

Check backend health:
```bash
curl https://skillswap-backend-cie7.onrender.com/api/health
```

---

## Local Development

Backend:
```bash
cd backend
npm install
npm run dev      # http://localhost:5000
```

Frontend:
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Local PostgreSQL (Docker):
```bash
docker run --name skillswap-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=skillexchange -p 5432:5432 -d postgres:15
```

---

## Common Issues

CORS error → Check ALLOWED_ORIGINS on Render matches your exact Vercel URL (no trailing slash)
Registration failed → Backend might be sleeping (free tier), wait 30s and retry
Video call not working cross-network → Add a TURN server to useWebRTC.js ICE_SERVERS
Database reset → PostgreSQL on Render persists data permanently (unlike SQLite)
