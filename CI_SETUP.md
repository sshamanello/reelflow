# CI/CD Setup Guide

## Переменные GitLab (Settings → CI/CD → Variables)

| Переменная | Тип | Protected | Masked | Описание |
|-----------|-----|-----------|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Variable | ✅ | ✅ | Токен Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | ✅ | ❌ | ID аккаунта Cloudflare |
| `TIKTOK_CLIENT_KEY` | Variable | ✅ | ❌ | TikTok OAuth key |
| `TIKTOK_CLIENT_SECRET` | Variable | ✅ | ✅ | TikTok OAuth secret |
| `CF_PAGES_PROJECT_NAME` | Variable | ❌ | ❌ | Имя проекта Pages (напр. `reelflow`) |

## Как получить CLOUDFLARE_API_TOKEN

1. Зайди на https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → Use template: **Edit Cloudflare Workers**
3. Добавь разрешения:
   - `Account` → `Cloudflare Pages` → **Edit**
   - `Account` → `Workers KV Storage` → **Edit**
   - `Account` → `Workers Scripts` → **Edit**
4. Скопируй токен → вставь в GitLab как `CLOUDFLARE_API_TOKEN`

## Как получить CLOUDFLARE_ACCOUNT_ID

Cloudflare Dashboard → правый sidebar → **Account ID** (копируй)

## Как создать Cloudflare Pages проект

```bash
# Локально один раз:
npm run build
npx wrangler pages project create reelflow
```

Или через Cloudflare Dashboard → Pages → Create a project → Direct Upload

## Схема веток

```
feature/* → merge request → develop → staging (auto deploy)
develop   → merge request → main    → production (auto deploy)
```

## Pipeline

```
[push to develop]
  ├── build (lint + vite build)
  ├── deploy:worker:staging   → reelflow-worker-dev.workers.dev
  └── deploy:pages:staging    → preview URL в Cloudflare Pages

[push to main]
  ├── build
  ├── deploy:worker:production → reelflow-worker.workers.dev
  └── deploy:pages:production  → reelflow.pages.dev (или твой домен)
```
