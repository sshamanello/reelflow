# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReelFlow is a multi-platform content automation platform built with Cloudflare Workers. It allows users to manage and publish content across TikTok and YouTube using OAuth 2.0 authentication.

**Architecture**: Single-page application (vanilla JS) + Cloudflare Worker backend + Cloudflare KV storage

## Development Commands

### Local Development
```bash
npm run dev              # Start local dev server on port 8787
npm run login            # Authenticate with Cloudflare
npm run tail             # View real-time logs from production
```

### Deployment
```bash
npm run deploy           # Deploy to development environment
npm run deploy:prod      # Deploy to production
```

### Secret Management
```bash
# For development: Create .dev.vars file with secrets
# For production: Use wrangler CLI
npx wrangler secret put TIKTOK_CLIENT_KEY --env production
npx wrangler secret put TIKTOK_CLIENT_SECRET --env production
npx wrangler secret put GOOGLE_CLIENT_ID --env production
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

## Architecture

### Frontend (`reelflow.html`)
- Single-page application with vanilla JavaScript (no build tools)
- Tailwind CSS via CDN for styling
- `config.js` contains OAuth client keys (public-facing)
- OAuth flow using popup windows with `postMessage` communication
- API calls to backend at `API_BASE` (auto-detected: localhost for dev, worker URL for prod)

### Backend (`worker.js`)
- Cloudflare Worker handling all API endpoints
- Session-based authentication with HttpOnly cookies (`rf_sid`)
- Two environments: development and production (configured in `wrangler.toml`)
- All secrets stored as Cloudflare Worker environment variables

### Data Storage (Cloudflare KV)
- `sid:${sessionId}` - User session data
- `tiktok:default` - TikTok access tokens
- `youtube:default` - YouTube access tokens
- `projects:${sessionId}` - User projects
- `videos:${sessionId}` - Video metadata

## API Endpoints

**Health & Auth:**
- `GET /health` - Health check
- `POST /api/oauth/exchange` - Exchange OAuth code for access token (platform-agnostic)
- `GET /api/me` - Get current user profile

**TikTok (Legacy - use /api/oauth/exchange instead):**
- `POST /api/tiktok/exchange` - TikTok OAuth exchange
- `GET /api/tiktok/me` - TikTok user profile
- `POST /api/tiktok/upload` - Upload video to TikTok
- `POST /api/tiktok/publish` - Publish video to TikTok

**Content Management:**
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/videos` - List videos
- `POST /api/videos` - Save video metadata
- `GET /api/stats` - Get platform statistics

## Configuration

### Environment Variables (wrangler.toml)
- `APP_ENV`, `APP_NAME`, `COOKIE_NAME`, `COOKIE_TTL_DAYS`
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (update when adding new domains!)

### Secrets (via wrangler CLI)
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Frontend Config (config.js)
- `tiktok.clientKey` - TikTok client key (public)
- `youtube.clientId` - Google client ID (public)
- `API_BASE` - Auto-detected based on hostname
- `REDIRECT_URI` - Auto-detected as `${origin}/callback`

## Important Notes

### OAuth Flow
1. Frontend opens popup with OAuth URL (using `clientKey`/`clientId` from config.js)
2. User authorizes, OAuth redirects to `${REDIRECT_URI}?code=...&state=...`
3. Callback page sends code to backend via `/api/oauth/exchange`
4. Backend exchanges code for access token (using `CLIENT_SECRET` env var)
5. Token stored in KV, session cookie set

### CORS Configuration
Update `ALLOWED_ORIGINS` in `wrangler.toml` when deploying to new domains. This is a common source of errors.

### Local vs Production
- Local: Uses `.dev.vars` for secrets (gitignored)
- Production: Uses Cloudflare Worker secrets (must be uploaded via CLI)

### KV Namespace
The `SESSIONS` binding in `wrangler.toml` points to a Cloudflare KV namespace. Create this in Cloudflare Dashboard before deploying.

## File Structure

- `reelflow.html` - Main SPA
- `worker.js` - Cloudflare Worker (all API logic)
- `config.js` - Frontend configuration (OAuth keys)
- `wrangler.toml` - Cloudflare Worker config
- `.dev.vars` - Local development secrets (gitignored)
- `test_oauth.html` - OAuth testing page
- `v1.html` - Previous app version (legacy)

## Quick Context Reference

**For current project status, recent changes, and next steps:** See `PROJECT_STATUS.md`

This file contains:
- What features are completed vs. in progress
- Current issues and known bugs
- Priority list for next development tasks
- Recent code changes and decisions
- Quick-start guide for returning to work
