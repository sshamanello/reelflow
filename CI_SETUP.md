# CI/CD Setup Guide

## Переменные GitLab (Settings → CI/CD → Variables)

| Переменная | Protected | Masked | Описание |
|-----------|-----------|--------|---------|
| `CLOUDFLARE_API_TOKEN` | ✅ | ✅ | Токен Cloudflare (Workers + KV) |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | ❌ | ID аккаунта Cloudflare |
| `TIKTOK_CLIENT_KEY` | ✅ | ❌ | TikTok OAuth client key |
| `TIKTOK_CLIENT_SECRET` | ✅ | ✅ | TikTok OAuth client secret |
| `REGRU_HOST` | ❌ | ❌ | Сервер reg.ru (напр. `server279.hosting.reg.ru`) |
| `REGRU_USER` | ❌ | ❌ | Логин FTP на reg.ru |
| `REGRU_PASSWORD` | ❌ | ✅ | Пароль FTP на reg.ru |
| `REGRU_PATH` | ❌ | ❌ | Путь на сервере (напр. `/www/sshamanello.ru`) |

## Как найти данные для REGRU_*

1. Зайди в [панель reg.ru](https://www.reg.ru/user/account/) → **Услуги → Хостинг**
2. Выбери свой хостинг → **Управление** → **FTP-аккаунты**
3. Там будут: хост (`server279.hosting.reg.ru`), логин и пароль

`REGRU_PATH` — это путь к папке сайта, обычно `/www/sshamanello.ru` или `/home/sshamanello/www`

## Как получить CLOUDFLARE_API_TOKEN

1. [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **Create Token** → шаблон **"Edit Cloudflare Workers"**
3. Добавь разрешение: `Account → Workers KV Storage → Edit`
4. Скопируй токен → вставь в GitLab

## Схема деплоя

```
feature/* → MR → develop  → staging  (только воркер)
develop   → MR → main     → production:
                              ├── worker → reelflow-worker.sshamanello.workers.dev
                              └── frontend → sshamanello.ru (reg.ru по FTPS)
```

## Pipeline

```
[push/MR на develop]
  ├── build                  → собирает dist/
  └── deploy:worker:staging  → деплоит dev-воркер

[push на main]
  ├── build                      → собирает dist/
  ├── deploy:worker:production   → деплоит prod-воркер
  └── deploy:frontend:regru      → заливает dist/ на reg.ru по FTPS
```
