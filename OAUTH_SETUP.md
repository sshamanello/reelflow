# ReelFlow - OAuth Setup Guide

This guide explains how to set up OAuth credentials for TikTok and YouTube.

---

## Quick Setup

1. Copy credentials from OAuth providers
2. Update `.env` file with your keys
3. Update `config.js` with frontend keys (clientKey/clientId)
4. Deploy Cloudflare Worker with environment variables

---

## Configuration Files

### `.env` - Backend credentials (Cloudflare Worker)
```bash
# Copy this from your OAuth providers
TIKTOK_CLIENT_KEY=your_tiktok_client_key_here
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### `config.js` - Frontend credentials
```javascript
// Copy the public keys from .env:
tiktok: {
  clientKey: 'your_tiktok_client_key_here',  // from .env: TIKTOK_CLIENT_KEY
}
youtube: {
  clientId: 'your_google_client_id_here',     // from .env: GOOGLE_CLIENT_ID
}
```

---

## TikTok OAuth Setup

1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Create a new app
3. Get your **Client Key** and **Client Secret**
4. Add redirect URI: `https://your-domain.com/callback`
5. For local development: `http://localhost:5500/callback` (or your port)

### Update `.env`:
```bash
TIKTOK_CLIENT_KEY=your_actual_key
TIKTOK_CLIENT_SECRET=your_actual_secret
```

### Update `config.js`:
```javascript
tiktok: {
  clientKey: 'your_actual_key',  // Same as TIKTOK_CLIENT_KEY
}
```

---

## YouTube (Google) OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - `https://your-domain.com/callback`
   - For local: `http://localhost:5500/callback`
7. Copy your **Client ID** and **Client Secret**

### Update `.env`:
```bash
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
```

### Update `config.js`:
```javascript
youtube: {
  clientId: 'your_actual_client_id',  // Same as GOOGLE_CLIENT_ID
}
```

---

## Cloudflare Worker Setup

### Environment Variables (Dashboard)
Set these in your Cloudflare Worker dashboard (Settings → Variables and Secrets):

```
SESSIONS = your_kv_namespace_binding
TIKTOK_CLIENT_KEY = your_tiktok_client_key
TIKTOK_CLIENT_SECRET = your_tiktok_client_secret
GOOGLE_CLIENT_ID = your_google_client_id
GOOGLE_CLIENT_SECRET = your_google_client_secret
COOKIE_NAME = rf_sid (optional)
COOKIE_TTL_DAYS = 30 (optional)
```

### Or using Wrangler CLI:
```bash
# Install wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy with env vars
wrangler secret put TIKTOK_CLIENT_KEY
wrangler secret put TIKTOK_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

---

## Testing OAuth Flow

1. Open `reelflow.html` in browser
2. Go to **Settings** page
3. Click **Connect** for TikTok or YouTube
4. A popup window will open with OAuth screen
5. After authorization, the popup sends code back
6. Backend exchanges code for access token
7. Profile is loaded and saved in session

### Quick Test:
Use `test_oauth.html` for simple OAuth testing.

---

## Troubleshooting

### "Redirect URI mismatch"
Make sure redirect URIs match exactly in:
- OAuth app settings
- `REDIRECT_URI` in `config.js`
- `redirect_uri` sent to backend

### "Invalid client"
Check that keys/secrets are correct and match between:
- `.env` file
- Cloudflare Worker environment variables
- `config.js` (for public keys)

### "No channel found" (YouTube)
Make sure your YouTube channel is properly linked to your Google account.

### CORS errors
Update allowed origins in `worker.js`:
```javascript
function makeCORS(env, origin) {
  const allowed = "https://your-domain.com"; // Change this
  return {
    "Access-Control-Allow-Origin": allowed,
    // ...
  };
}
```

---

## File Structure

```
reelflow/
├── .env                 # Backend secrets (NEVER commit this)
├── .env.example         # Template for .env
├── .gitignore           # Ignores .env
├── config.js            # Frontend config (public keys only)
├── reelflow.html        # Main app
├── test_oauth.html      # OAuth test page
├── worker.js            # Cloudflare Worker
└── OAUTH_SETUP.md       # This file
```
