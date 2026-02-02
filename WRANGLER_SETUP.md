# 🚀 Wrangler Setup Guide - ReelFlow

## Быстрый старт

### 1. Установите зависимости
```bash
npm install
```

### 2. Логин в Cloudflare
```bash
npm run login
# или
npx wrangler login
```

### 3. Загрузите секреты для Production

**ВАЖНО:** Эти команды нужно выполнить ОДИН РАЗ

```bash
# TikTok OAuth
npx wrangler secret put TIKTOK_CLIENT_KEY --env production
# Вставьте: awz0u4dkl7733fhp

npx wrangler secret put TIKTOK_CLIENT_SECRET --env production
# Вставьте ваш TikTok Client Secret

# YouTube OAuth
npx wrangler secret put GOOGLE_CLIENT_ID --env production
# Вставьте ваш Google Client ID

npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
# Вставьте ваш Google Client Secret

# KV Namespace для сессий
# 1. Создайте KV в Cloudflare Dashboard: Workers & Pages → KV → Create a namespace
# 2. Назовите его "reelflow-sessions"
# 3. Привяжите к воркеру:

npx wrangler secret put SESSIONS --env production
# Вставьте: reelflow-sessions
```

### 4. Создайте KV Namespace в Cloudflare

1. Зайдите в https://dash.cloudflare.com/
2. Workers & Pages → KV → Create a namespace
3. Name: `reelflow-sessions`
4. Нажмите "Add"

### 5. Обновите ALLOWED_ORIGINS в wrangler.toml

Для прода добавьте свой домен:
```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://sshamanello.ru,https://ваш-домен.com"
```

---

## Локальная разработка

### Запуск локально
```bash
npm run dev
# или
npx wrangler dev
```

Секреты берутся из `.dev.vars` автоматически!

Проверка: http://localhost:8787/health

---

## Деплой

### Development (тестовый воркер)
```bash
npx wrangler deploy --env dev
```

### Production
```bash
npm run deploy:prod
# или
npx wrangler deploy --env production
```

---

## Полезные команды

```bash
# Просмотр логов в реальном времени
npm run tail
# или
npx wrangler tail

# Просмотр всех секретов (только имена!)
npx wrangler secret list --env production

# Удаление секрета (если нужно)
npx wrangler secret bulk delete TIKTOK_CLIENT_KEY --env production
```

---

## Структура переменных

### Публичные (в wrangler.toml)
- ✅ `APP_NAME` - имя приложения
- ✅ `ALLOWED_ORIGINS` - разрешённые origin для CORS
- ✅ `COOKIE_NAME` - имя куки
- ✅ `COOKIE_TTL_DAYS` - время жизни куки

### Секретные (через wrangler secret)
- 🔒 `TIKTOK_CLIENT_KEY` - TikTok Client Key
- 🔒 `TIKTOK_CLIENT_SECRET` - TikTok Client Secret
- 🔒 `GOOGLE_CLIENT_ID` - Google Client ID
- 🔒 `GOOGLE_CLIENT_SECRET` - Google Client Secret
- 🔒 `SESSIONS` - KV namespace binding

---

## Troubleshooting

### Ошибка "Namespace not found"
Решение: Создайте KV namespace в Cloudflare Dashboard

### Ошибка "secret not set"
Решение: Запустите `npx wrangler secret put <SECRET_NAME>`

### CORS ошибка
Решение: Добавьте ваш origin в `ALLOWED_ORIGINS` в wrangler.toml

### Локально не работает
Решение: Проверьте что `.dev.vars` существует и заполнен

---

## Cheat Sheet

```bash
# Установить зависимости
npm install

# Логин
npm run login

# Локальная разработка
npm run dev

# Загрузить секрет (повторить для каждого!)
npx wrangler secret put TIKTOK_CLIENT_KEY --env production

# Деплой в прод
npm run deploy:prod

# Посмотреть логи
npm run tail
```

---

## Следующие шаги

1. ✅ Выполните `npm install`
2. ✅ Выполните `npm run login`
3. ✅ Загрузите все секреты через `wrangler secret put`
4. ✅ Создайте KV namespace в Cloudflare
5. ✅ Деплой: `npm run deploy:prod`

Готово! 🎉
