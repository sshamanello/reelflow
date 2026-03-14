# ReelFlow

Платформа для автоматизации публикации контента на TikTok. Регистрируйся, подключай аккаунт и публикуй видео.

[![CI](https://github.com/sshamanello/reelflow/actions/workflows/deploy.yml/badge.svg)](https://github.com/sshamanello/reelflow/actions/workflows/deploy.yml)

**Live:** [sshamanello.ru](https://sshamanello.ru)

## Стек

- **Frontend:** React 18 + Vite + React Router v6
- **Backend:** Cloudflare Workers
- **База данных:** Cloudflare KV
- **Auth:** email/пароль (PBKDF2) + сессии через HttpOnly cookie
- **OAuth:** TikTok OAuth 2.0 с PKCE (S256)
- **CI/CD:** GitHub Actions → Cloudflare Workers + reg.ru (FTPS)

## Локальный запуск

### Требования

- Node.js 20+
- Аккаунт Cloudflare (бесплатный)
- TikTok Developer аккаунт с приложением

### Установка

```bash
git clone https://github.com/sshamanello/reelflow.git
cd reelflow
npm install
```

### Конфигурация

Создай файл `.dev.vars` в корне проекта:

```
TIKTOK_CLIENT_KEY=твой_ключ
TIKTOK_CLIENT_SECRET=твой_секрет
COOKIE_NAME=rf_sid
COOKIE_TTL_DAYS=30
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Запуск

```bash
# Терминал 1 — Worker (порт 8787)
npm run worker:dev

# Терминал 2 — Frontend (порт 5173)
npm run dev
```

Открой [http://localhost:5173](http://localhost:5173)

> Vite автоматически проксирует `/api/*` на `localhost:8787`

## Деплой

Деплой происходит автоматически через GitHub Actions:

| Ветка | Что деплоится |
|---|---|
| `develop` | Worker → staging (reelflow-worker-dev.sshamanello.workers.dev) |
| `main` | Worker → production + Frontend → sshamanello.ru |

### Настройка CI/CD (GitHub Secrets)

Добавь в **Settings → Secrets and variables → Actions**:

| Secret | Описание |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API токен с правами Edit Workers + KV Storage |
| `CLOUDFLARE_ACCOUNT_ID` | ID аккаунта Cloudflare |
| `TIKTOK_CLIENT_KEY` | TikTok client key |
| `TIKTOK_CLIENT_SECRET` | TikTok client secret |
| `REGRU_HOST` | Хост FTP на reg.ru |
| `REGRU_USER` | Логин FTP |
| `REGRU_PASSWORD` | Пароль FTP |
| `REGRU_PATH` | Путь к папке сайта |

### Ручной деплой

```bash
# Worker в dev окружение
npm run worker:deploy

# Worker в production
npm run worker:deploy:prod

# Установка секретов для production
npx wrangler secret put TIKTOK_CLIENT_KEY --env production
npx wrangler secret put TIKTOK_CLIENT_SECRET --env production
```

## Архитектура

```
┌─────────────────────┐     ┌──────────────────────┐
│  React SPA (Vite)   │────▶│  Cloudflare Worker   │
│  sshamanello.ru     │     │  worker.js           │
└─────────────────────┘     └──────────┬───────────┘
                                       │
                              ┌────────▼────────┐
                              │  Cloudflare KV  │
                              │  (sessions,     │
                              │   users,tokens) │
                              └─────────────────┘
```

### OAuth Flow (TikTok PKCE)

1. Frontend генерирует `code_verifier` + `code_challenge` (SHA-256)
2. Пользователь авторизуется на TikTok
3. TikTok редиректит на `/auth/callback?code=...`
4. Frontend отправляет `code` + `code_verifier` на worker
5. Worker меняет код на access token, сохраняет в KV

## API

```
POST /api/auth/register    { email, password }
POST /api/auth/login       { email, password }
POST /api/auth/logout
GET  /api/auth/me

POST /api/oauth/exchange   { platform, code, redirect_uri, code_verifier }

GET  /api/projects
POST /api/projects
GET  /api/videos
POST /api/videos
GET  /api/stats
GET  /health
```

## Лицензия

MIT
