# Deployment Guide — Law Library Management System

This walks through taking the app from your local machine to fully live:
GitHub → Backend (Railway or Render) → Frontend (Vercel) → final checks.

Your Supabase database is already fully set up and populated (you built it
during development), so **there's no separate "production database" step**
here — we're deploying the *code* to talk to the database you already have.
If you'd rather keep development and production data completely separate,
see the note at the very end.

---

## Step 1 — Push to GitHub

**1.1 — Check nothing secret is about to be committed**
Both `backend/.gitignore` and `frontend/.gitignore` already exclude `.env`,
`node_modules/`, and `dist/`. Before your first commit, double-check neither
`.env` file is already tracked:
```
cd D:\REAL_PROJECTS\LIBRARY_MANAGEMENT\law-library-system
git status
```
If `backend/.env` or `frontend/.env` shows up as a file to be committed,
**stop** — that means your real database password and JWT secret would go
to GitHub. Run `git rm --cached backend/.env frontend/.env` first if so.

**1.2 — Initialize and push**
```
git init
git add .
git commit -m "Law Library Management System"
```
Create a new repository on GitHub (empty, no README/license — you already
have files), then:
```
git remote add origin https://github.com/YOUR_USERNAME/law-library-system.git
git branch -M main
git push -u origin main
```

**1.3 — Verify** — refresh the GitHub page and confirm you see `backend/`
and `frontend/` folders, but **no `.env` files** listed anywhere.

---

## Step 2 — Deploy the Backend

You can use either Railway or Render — both work the same way for this app.
Pick one.

### Option A — Render

1. Go to render.com → sign in with GitHub → **New +** → **Web Service**.
2. Connect your `law-library-system` repository.
3. Render should detect `backend/render.yaml` automatically and offer to
   use it (click **Apply**). If it doesn't, configure manually:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/health`
4. Under **Environment**, add these variables (values from your local
   `backend/.env` — copy them over, don't retype from memory):
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = *(your Supabase pooled connection string)*
   - `DIRECT_URL` = *(your Supabase session pooler connection string)*
   - `JWT_SECRET` = *(your existing secret — reuse it so existing logins don't all break, or generate a new one if you're fine with everyone re-logging in)*
   - `JWT_EXPIRES_IN` = `8h`
   - `CORS_ORIGIN` = *(leave blank for now — we'll fill this in after Step 3, once you have your Vercel URL)*
   - `RATE_LIMIT_WINDOW_MS` = `900000`
   - `RATE_LIMIT_MAX` = `300`
5. Click **Create Web Service**. First deploy takes a few minutes.

### Option B — Railway

1. Go to railway.app → sign in with GitHub → **New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. Click the created service → **Settings**:
   - **Root Directory**: `backend`
   - Railway auto-detects the build/start commands from `package.json`.
4. Go to **Variables** and add the same list as Option A above.
5. Railway auto-assigns a public URL under **Settings → Networking → Generate Domain**.

### 2.1 — Verify the backend is live
Once deployed, note the public URL (e.g. `https://law-library-backend.onrender.com`
or `https://your-app.up.railway.app`). Test it:
```
curl https://YOUR-BACKEND-URL/health
```
Expected: `{"status":"ok","timestamp":"..."}`

If it fails, check the platform's build/deploy logs — the most common
issue is a missing or mistyped environment variable.

**If the build log shows `prisma generate` failing** with a network/fetch
error: this is very unlikely on Render or Railway (both have full internet
access), but if it happens, add `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`
as an environment variable and redeploy.

---

## Step 3 — Deploy the Frontend (Vercel)

1. Go to vercel.com → sign in with GitHub → **Add New** → **Project**.
2. Import your `law-library-system` repository.
3. Configure:
   - **Root Directory**: `frontend`
   - Framework Preset: Vercel should auto-detect **Vite**.
   - Build Command: `npm run build` (default is fine)
   - Output Directory: `dist` (default is fine)
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = *(your backend URL from Step 2, no trailing slash — e.g. `https://law-library-backend.onrender.com`)*
5. Click **Deploy**.

`vercel.json` (already in the `frontend` folder) handles client-side routing,
so refreshing the page on `/books` or any other route won't 404.

### 3.1 — Note your frontend URL
Vercel gives you something like `https://law-library-system.vercel.app`.

---

## Step 4 — Connect the two: update CORS

Go back to your backend's environment variables (Render or Railway) and set:
```
CORS_ORIGIN=https://law-library-system.vercel.app
```
(Your actual Vercel URL from Step 3.1 — no trailing slash.)

Save — this triggers a redeploy on most platforms. Once it's done, your
backend will only accept requests from your actual frontend, not just any
website, which is the correct production setting.

---

## Step 5 — Final smoke test

1. Open your Vercel URL in a browser.
2. Log in with your real owner/admin credentials.
3. Confirm the Dashboard loads with real numbers (not zeros or errors).
4. Click through a few pages: Books, Employees, Reports.
5. Try adding a book and confirm it saves.

If anything fails at this stage, open your browser's dev tools → Network
tab → look for failed requests and their status codes:
- **CORS error in console** → double check Step 4, and that there's no
  trailing slash mismatch.
- **401 on every request** → check `JWT_SECRET` matches what's expected;
  if you changed it during deployment, everyone (including you) needs to
  log in again, which is expected.
- **500 errors** → check your backend platform's logs; usually a
  `DATABASE_URL`/`DIRECT_URL` issue.

For a fuller pass, work through `QA_CHECKLIST.md` again against the live
URL, not just localhost — a few things (CORS, environment variables) only
show their problems once actually deployed.

---

## Optional: separate production database

Everything above reuses your existing Supabase project for both development
and production. That's a completely reasonable choice for a small internal
tool — most law firms this size won't need the separation. But if you'd
prefer dev and prod to be fully isolated:

1. Create a **second** Supabase project (same steps as your first one, back
   in Phase 1–3).
2. Run `backend/prisma/manual_init.sql` against it via `psql`, exactly like
   you did the first time.
3. Use that new project's connection strings as `DATABASE_URL`/`DIRECT_URL`
   in your **deployed** backend's environment variables (keep your local
   `.env` pointed at the original project for development).
4. Run `backend/prisma/seed.ts` against the new database if you want it to
   start with the same sample data, or leave it empty and add real data
   through the app once it's live.

---

## Ongoing: making future changes

Once live, your workflow for any future change is:
1. Make the change locally, test with `npm run dev` on both sides.
2. Commit and push to GitHub (`git add . && git commit -m "..." && git push`).
3. Render/Railway and Vercel both auto-deploy on push to `main` by default
   — no manual redeploy step needed.
4. If the change includes a database schema change, apply it to your
   Supabase database first (the same way we did originally — either
   `npx prisma migrate dev` if that ends up working in your environment, or
   hand-written SQL via `psql` as a fallback) **before** pushing the code
   that depends on it.
