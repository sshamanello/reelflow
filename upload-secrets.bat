@echo off
REM ========================================
REM ReelFlow - Auto-upload secrets to Cloudflare (Windows)
REM ========================================

setlocal enabledelayedexpansion

set ENV=%1
if "%ENV%"=="" set ENV=production

echo 🔐 Загрузка секретов в Cloudflare Workers...
echo.
echo 📦 Окружение: %ENV%
echo.

REM TikTok
echo 1️⃣ TikTok Client Key...
npx wrangler secret put TIKTOK_CLIENT_KEY --env %ENV%

echo.
echo 2️⃣ TikTok Client Secret...
npx wrangler secret put TIKTOK_CLIENT_SECRET --env %ENV%

echo.
echo 3️⃣ Google Client ID...
npx wrangler secret put GOOGLE_CLIENT_ID --env %ENV%

echo.
echo 4️⃣ Google Client Secret...
npx wrangler secret put GOOGLE_CLIENT_SECRET --env %ENV%

echo.
echo 5️⃣ Sessions KV namespace...
echo reelflow-sessions| npx wrangler secret put SESSIONS --env %ENV%

echo.
echo ✅ Все секреты загружены!
echo.
echo ⚠️  Не забудьте создать KV namespace 'reelflow-sessions' в Cloudflare Dashboard:
echo    https://dash.cloudflare.com → Workers & Pages → KV → Create a namespace
echo.

pause
