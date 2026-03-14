export const user = {
  email: "nikolay@reelflow.app",
  role: "Owner",
  workspace: "ReelFlow Studio",
};

export const stats = [
  { label: "Всего задач", value: "148" },
  { label: "Успешно опубликовано", value: "127" },
  { label: "Запланировано", value: "18" },
  { label: "С ошибкой", value: "3" },
];

export const historyItems = [
  {
    title: "Публикация: Тест ролика 01",
    status: "success",
    meta: ["Тип: пост", "Платформы: TikTok, YouTube Shorts", "Дата: 09.03.2026 12:10"],
  },
  {
    title: "Репост: Весенний оффер",
    status: "queue",
    meta: ["Тип: репост", "Источник: Instagram", "Назначение: TikTok, Facebook"],
  },
  {
    title: "Публикация: Shorts №17",
    status: "error",
    meta: ["Платформа: TikTok", "Причина: истёк токен доступа", "Дата: 08.03.2026 21:44"],
  },
];

export const accounts = [
  {
    name: "TikTok",
    code: "TT",
    status: "Подключено",
    statusType: "success",
    account: "@reelflow.demo",
    auth: "OAuth 2.0",
    token: "Активен",
  },
  {
    name: "Instagram Reels",
    code: "IG",
    status: "Подключено",
    statusType: "success",
    account: "@brand.team",
    auth: "Business OAuth",
    token: "Активен",
  },
  {
    name: "YouTube Shorts",
    code: "YT",
    status: "Подключено",
    statusType: "success",
    account: "ReelFlow Studio",
    auth: "Google OAuth",
    token: "Активен",
  },
  {
    name: "Новое подключение",
    code: "+",
    status: "Не подключено",
    statusType: "neutral",
    account: "—",
    auth: "—",
    token: "—",
  },
];
