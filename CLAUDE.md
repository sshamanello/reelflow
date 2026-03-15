# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReelFlow is a TikTok content automation platform built with Cloudflare Workers. Users register/login, connect their TikTok account via OAuth 2.0, and publish videos.

**Architecture**: React SPA (Vite) + Cloudflare Worker backend + Cloudflare KV storage

**Live URLs:**
- Frontend: https://sshamanello.ru
- Worker (production): https://reelflow-worker.sshamanello.workers.dev
- Worker (staging/dev): https://reelflow-worker-dev.sshamanello.workers.dev

**Repository:** https://github.com/sshamanello/reelflow

## Development Commands

```bash
# Frontend
npm run dev              # Vite dev server on :5173 (proxies /api/* → :8787)
npm run build            # Build to dist/

# Worker (Cloudflare)
npm run worker:dev       # IMPORTANT: must use --env dev (binds KV namespace)
npm run worker:tail      # Real-time production logs

# Deploy
npm run worker:deploy           # Deploy worker to dev env
npm run worker:deploy:prod      # Deploy worker to production
```

> **Critical:** Always use `npm run worker:dev` (not `wrangler dev` directly) — it includes `--env dev` which is required for KV namespace binding. Without it, `env.SESSIONS` will be undefined.

## Local Development Setup

1. Create `.dev.vars` (gitignored) with:
```
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
COOKIE_NAME=rf_sid
COOKIE_TTL_DAYS=30
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
2. Run `npm run worker:dev` (port 8787) in one terminal
3. Run `npm run dev` (port 5173) in another terminal
4. Vite proxies `/api/*` and `/health` to `:8787` automatically

## Architecture

### Frontend (`src/`)
- React 18 + Vite + React Router v6
- `src/context/AuthContext.jsx` — user session state, `useAuth()` hook
- `src/lib/api.js` — all API calls to worker
- `src/lib/oauth.js` — TikTok OAuth with PKCE (async, generates code_verifier/challenge)
- `src/lib/auth.js` — register/login/logout API calls
- `src/lib/i18n.js` — custom i18n (RU/EN), `t(key)` function
- `src/hooks/useI18n.js` — React hook for i18n
- Route guards: `ProtectedRoute` (→ /landing if not logged in), `GuestRoute` (→ / if logged in)

### Backend (`worker.js`)
- Single file Cloudflare Worker
- Session auth via HttpOnly cookie `rf_sid`
- Password hashing: PBKDF2 (Web Crypto API, 100k iterations)
- Two environments: `dev` and `production` (wrangler.toml)

### Data Storage (Cloudflare KV — `SESSIONS` binding)
```
users:${userId}              → { id, email, passwordHash, salt, createdAt }
users:email:${email}         → userId (lookup index)
sid:${sessionId}             → { userId, email, createdAt }
tiktok:${userId}             → TikTok access token
projects:${sessionId}        → User projects
videos:${sessionId}          → Video metadata
```

## API Endpoints

**User Auth:**
- `POST /api/auth/register` — { email, password }
- `POST /api/auth/login` — { email, password } → sets rf_sid cookie
- `POST /api/auth/logout` — clears cookie
- `GET /api/auth/me` — returns { id, email }

**OAuth:**
- `POST /api/oauth/exchange` — { platform, code, redirect_uri, code_verifier }

**Content:**
- `GET /api/projects` / `POST /api/projects`
- `GET /api/videos` / `POST /api/videos`
- `GET /api/stats`
- `GET /health`

## TikTok OAuth Flow (PKCE)

1. `buildTikTokOAuthUrl()` (async) generates `code_verifier` + `code_challenge` (S256)
2. Stores verifier in `sessionStorage`
3. User redirected to TikTok → back to `/auth/callback?platform=tiktok&code=...`
4. `AuthCallback.jsx` reads `code_verifier` from sessionStorage, sends to worker
5. Worker calls TikTok token endpoint with `code_verifier`

**Important:** The redirect URI `https://sshamanello.ru/auth/callback?platform=tiktok` must be registered in TikTok Developer Portal → Login Kit → Redirect URI. For local dev, also register `http://localhost:5173/auth/callback?platform=tiktok`.

## CI/CD (GitHub Actions)

File: `.github/workflows/deploy.yml`

```
push/PR to develop → build + deploy:worker:staging (dev env)
push to main       → build + deploy:worker:production + deploy:frontend (reg.ru)
```

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN` — Edit Cloudflare Workers template + KV Storage Edit
- `CLOUDFLARE_ACCOUNT_ID` — `43f13ba02a4a8e223f3e620d4e67417e`
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- `REGRU_HOST`, `REGRU_USER`, `REGRU_PASSWORD`, `REGRU_PATH`

Frontend deploys to reg.ru via FTPS (`lftp`). Worker deploys via `wrangler deploy`.

## Configuration

### wrangler.toml environments
- `[env.dev]` — name: `reelflow-worker-dev`, KV id: `3e2eff90906d4312b5fa692d56dd659c`
- `[env.production]` — name: `reelflow-worker`, same KV namespace

### CORS
`ALLOWED_ORIGINS` in wrangler.toml — update when adding new domains. Common source of errors.

## File Structure

```
src/
  pages/        Landing, Login, Register, Dashboard, Post, Accounts, AuthCallback, ...
  components/   Sidebar
  context/      AuthContext.jsx
  hooks/        useI18n.js
  lib/          api.js, auth.js, oauth.js, i18n.js
worker.js       Cloudflare Worker (all backend logic)
wrangler.toml   Worker config (environments, KV bindings)
.dev.vars       Local secrets (gitignored)
.github/workflows/deploy.yml  CI/CD
```

## TikTok Token Persistence

TikTok tokens survive logout/login cycles via a two-layer KV storage:

- **Session layer** (`sid:${sessionId}`) — ephemeral, deleted on logout
- **User layer** (`tiktok_token:${userId}`) — persistent, TTL 60 days

Flow:
- On `POST /api/oauth/exchange` → saves token to both session and `tiktok_token:${userId}`
- On `POST /api/auth/login` → restores token from `tiktok_token:${userId}` into new session
- On `POST /api/oauth/disconnect` (platform disconnect) → deletes from both

## TikTok OAuth Notes

- Redirect URI **must not** contain query params → use `https://sshamanello.ru/auth/callback` (no `?platform=tiktok`)
- Platform identifier stored in `sessionStorage` before redirect, read in `AuthCallback.jsx`
- Redirect URI must be registered in TikTok Developer Portal → Login Kit for each environment

## Favicon

- Files: `public/logo.svg` and `public/logo.png` (deployed to `/ReelFlow/logo.svg`)
- Referenced in `index.html` with relative paths (`href="logo.svg"`) so Vite applies base correctly
- Terms/Privacy pages use `/static/brand/logo.svg` (absolute path, files at root of sshamanello.ru)

## Static Pages (root-redirect/)

Files in `E:\code\reelflow\root-redirect\` are **not** part of the Vite build — upload manually to `/www/sshamanello.ru/`:
- `terms.html` → accessible at `sshamanello.ru/terms`
- `privacy.html` → accessible at `sshamanello.ru/privacy`

Root `.htaccess` handles clean URLs: `/terms` → `terms.html`, `/privacy` → `privacy.html`

## Current State (2026-03-15)

**Done:**
- User auth (register/login/logout) with PBKDF2
- TikTok OAuth with PKCE
- TikTok token persisted across logout/login (`tiktok_token:${userId}` in KV)
- Landing page with RU/EN i18n
- Post page: video preview (compact rectangle), thumbnail picker (capture frame / upload image)
- Dashboard: stat cards (connected/uploaded/errors), TikTok avatar display
- Sidebar: Repost tab hidden, Terms/Privacy links at bottom
- Terms of Service and Privacy Policy pages (dark style, Russian)
- Favicon (logo.svg + logo.png in public/)
- GitHub Actions CI/CD → Cloudflare Workers + reg.ru

**Known issues / TODO:**
- TikTok App Review: need to submit for production access
- YouTube support removed (TikTok-only for now)
