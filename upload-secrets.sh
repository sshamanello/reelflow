#!/bin/bash

# ========================================
# ReelFlow - Upload secrets to Cloudflare
# ========================================
# Этот скрипт запрашивает секреты интерактивно
# ========================================

set -e

echo "🔐 Загрузка секретов в Cloudflare Workers..."
echo ""

# Окружение (по умолчанию production)
ENV=${1:-production}

echo "📦 Окружение: $ENV"
echo ""

# TikTok
echo "1️⃣ TikTok Client Key..."
npx wrangler secret put TIKTOK_CLIENT_KEY --env $ENV

echo "2️⃣ TikTok Client Secret..."
npx wrangler secret put TIKTOK_CLIENT_SECRET --env $ENV

# YouTube
echo "3️⃣ Google Client ID..."
npx wrangler secret put GOOGLE_CLIENT_ID --env $ENV

echo "4️⃣ Google Client Secret..."
npx wrangler secret put GOOGLE_CLIENT_SECRET --env $ENV

# KV Namespace (вам нужно создать его вручную в Cloudflare Dashboard!)
echo "5️⃣ Sessions KV namespace..."
npx wrangler secret put SESSIONS --env $ENV

echo ""
echo "✅ Все секреты загружены!"
echo ""
echo "⚠️  Не забудьте создать KV namespace 'reelflow-sessions' в Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com → Workers & Pages → KV → Create a namespace"
echo ""
