const APP_BASE = import.meta.env.VITE_APP_BASE || window.location.origin;

const TIKTOK_CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function getCallbackUrl(platform) {
  return `${APP_BASE}/auth/callback?platform=${platform}`;
}

export function buildTikTokOAuthUrl() {
  if (!TIKTOK_CLIENT_KEY) {
    throw new Error("Missing VITE_TIKTOK_CLIENT_KEY");
  }

  const redirectUri = getCallbackUrl("tiktok");
  const state = crypto.randomUUID();

  sessionStorage.setItem("rf_oauth_state_tiktok", state);

  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    scope: "user.info.basic,video.upload",
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export function buildGoogleOAuthUrl() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID");
  }

  const redirectUri = getCallbackUrl("youtube");
  const state = crypto.randomUUID();

  sessionStorage.setItem("rf_oauth_state_youtube", state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function validateOAuthState(platform, stateFromUrl) {
  const key = platform === "tiktok"
    ? "rf_oauth_state_tiktok"
    : "rf_oauth_state_youtube";

  const saved = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);

  return !!saved && saved === stateFromUrl;
}
