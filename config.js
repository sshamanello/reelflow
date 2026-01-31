// ========================================
// ReelFlow - Frontend Configuration
// ========================================
// ⚠️ UPDATE THESE VALUES with your OAuth credentials
//
// You can copy these from your .env file:
// - TIKTOK_CLIENT_KEY → tiktok.clientKey
// - GOOGLE_CLIENT_ID → youtube.clientId
// ========================================

const CONFIG = {
  // Backend API URL
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8787'
    : '',

  // OAuth Redirect URI (auto-detected)
  REDIRECT_URI: window.location.origin + '/callback',

  // ==========================================
  // ⚠️ UPDATE THESE WITH YOUR CREDENTIALS
  // ==========================================

  // TikTok
  // Get your keys at: https://developers.tiktok.com/
  tiktok: {
    clientKey: 'YOUR_TIKTOK_CLIENT_KEY',     // ← Paste from .env: TIKTOK_CLIENT_KEY
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    scopes: ['user.info.basic'],
  },

  // YouTube
  // Get your keys at: https://console.cloud.google.com/
  youtube: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID',       // ← Paste from .env: GOOGLE_CLIENT_ID
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
  },
};
