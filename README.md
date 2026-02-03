# 🎬 ReelFlow

> Multi-platform content automation platform for creators

[![TikTok](https://img.shields.io/badge/TikTok-000000?style=for-the-badge&logo=tiktok&logoColor=white)](https://www.tiktok.com)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

**ReelFlow** — это платформа для автоматизации публикации контента на нескольких платформах. Загружайте видео один раз и публикуйте на TikTok и YouTube без лишних усилий.

## ✨ Возможности

- 🎥 **Загрузка видео** — загружайте видео один раз, публикуйте везде
- 📊 **Аналитика** — отслеживайте статистику по всем платформам в одном месте
- 🗓️ **Планировщик** — создавайте контент заранее и публикуйте в удобное время
- 🔐 **Безопасная авторизация** — OAuth 2.0 для TikTok и YouTube
- 🌙 **Темная тема** — удобный интерфейс в любое время суток
- 📱 **Адаптивный дизайн** — работает на всех устройствах

## 🚀 Быстрый старт

### Требования

- Node.js 22+
- Аккаунт Cloudflare с планом Workers Paid
- TikTok для разработчиков API ключ
- Google Cloud проект с YouTube Data API v3

### Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/sshamanello/reelflow.git
cd reelflow

# Установите зависимости
npm install
```

### Конфигурация

```bash
# Скопируйте файл переменных окружения
cp .env.example .env

# Отредактируйте .env с вашими ключами
# TIKTOK_CLIENT_KEY=ваш_ключ
# TIKTOK_CLIENT_SECRET=ваш_секрет
# GOOGLE_CLIENT_ID=ваш_id
# GOOGLE_CLIENT_SECRET=ваш_секрет
```

### Локальный запуск

```bash
# Запустите dev сервер
npm run dev

# Откройте http://localhost:8787
```

## 📦 Деплой

### Продакшн

```bash
# Деплой на Cloudflare Workers
npm run deploy:prod
```

### Управление секретами

```bash
# Установите секреты для production
npx wrangler secret put TIKTOK_CLIENT_KEY --env production
npx wrangler secret put TIKTOK_CLIENT_SECRET --env production
npx wrangler secret put GOOGLE_CLIENT_ID --env production
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

## 🏗️ Архитектура

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Frontend      │──────▶│  Cloudflare      │──────▶│   TikTok    │
│  (reelflow.html) │      │  Worker API      │      │     API     │
└─────────────────┘      └──────────────────┘      └─────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │   YouTube   │
                         │     API     │
                         └─────────────┘
```

### Технологии

**Фронтенд:**
- React 18 (via CDN)
- Tailwind CSS
- Vanilla JavaScript (no build step)

**Бэкенд:**
- Cloudflare Workers
- Cloudflare KV Storage
- OAuth 2.0

## 📸 Скриншоты

### Дашборд
Статистика по всем вашим платформам в одном месте

### Загрузка видео
Простой процесс загрузки в 4 шага

### Настройки
Управление подключенными аккаунтами

## 🔧 Доступные команды

```bash
npm run dev          # Локальный dev сервер (port 8787)
npm run login        # Авторизация в Cloudflare
npm run tail         # Логи продакшена в реальном времени
npm run deploy       # Деплой в dev окружение
npm run deploy:prod  # Деплой в production
```

## 📖 API Документация

### Аутентификация

**Получить профиль пользователя**
```http
GET /api/me
Authorization: Bearer <session_id>
```

**Обмен OAuth кода**
```http
POST /api/oauth/exchange
Content-Type: application/json

{
  "platform": "tiktok",
  "code": "authorization_code",
  "redirect_uri": "https://yourdomain.com/callback"
}
```

### Загрузка видео

**Загрузить на TikTok**
```http
POST /api/tiktok/upload
Authorization: Bearer <session_id>
Content-Type: multipart/form-data

file: <video>
```

## 🔐 Безопасность

- Все токены хранятся в зашифрованном Cloudflare KV
- HTTP-only cookies для сессий
- CSRF защита через state параметр
- CORS настроен для вашего домена

## 🤝 Участие в разработке

Мы будем рады вашим вкладам! Не стесняйтесь создавать fork и отправлять pull requests.

1. Fork проект
2. Создайте ветку для фичи (`git checkout -b feature/AmazingFeature`)
3. Закоммитьте изменения (`git commit -m 'Add some AmazingFeature'`)
4. Запушьте в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

## 👨‍💻 Автор

**Sshamanello**
- Website: [sshamanello.ru](https://sshamanello.ru)
- GitHub: [@sshamanello](https://github.com/sshamanello)

## 🙏 Благодарности

- [Cloudflare Workers](https://workers.cloudflare.com/) — серверless платформа
- [TikTok for Developers](https://developers.tiktok.com/) — API документация
- [YouTube Data API v3](https://developers.google.com/youtube/v3) — API документация

---

**Создано с ❤️ для контент-креаторов**

Если вам понравился проект, поставьте ⭐️ на GitHub!
