// Simple i18n system for ReelFlow

const translations = {
  ru: {
    // Nav
    nav_home: "Главная",
    nav_history: "История",
    nav_post: "Опубликовать",
    nav_repost: "Репост",
    nav_accounts: "Аккаунты",
    nav_settings: "Настройки",
    nav_logout: "Выйти",
    nav_help: "Помощь",
    nav_subscription: "Подписка",

    // Auth
    auth_login: "Войти",
    auth_register: "Зарегистрироваться",
    auth_email: "Email",
    auth_password: "Пароль",
    auth_name: "Имя",
    auth_no_account: "Нет аккаунта?",
    auth_have_account: "Уже есть аккаунт?",
    auth_login_title: "Вход в ReelFlow Studio",
    auth_register_title: "Создать аккаунт",
    auth_signing_in: "Вход...",
    auth_registering: "Регистрация...",
    auth_error_invalid: "Неверный email или пароль",
    auth_error_email_taken: "Этот email уже зарегистрирован",
    auth_error_short_password: "Пароль должен быть не менее 6 символов",
    auth_error_server: "Ошибка сервера. Попробуйте позже",

    // Landing
    landing_hero_title: "Публикуй видео в TikTok\nодним кликом",
    landing_hero_subtitle: "ReelFlow Studio — платформа автоматизации контента. Подключи TikTok через официальный OAuth и публикуй видео прямо из браузера.",
    landing_cta_start: "Начать бесплатно",
    landing_cta_login: "Войти",
    landing_features_title: "Всё что нужно для публикации",
    landing_feature_1_title: "Безопасная авторизация",
    landing_feature_1_desc: "Используем официальный TikTok OAuth 2.0. Никаких паролей — только токены.",
    landing_feature_2_title: "Быстрая загрузка",
    landing_feature_2_desc: "Загружай видео напрямую в TikTok через официальный API. До 4 ГБ.",
    landing_feature_3_title: "История публикаций",
    landing_feature_3_desc: "Храним историю всех загруженных видео. Удобный список и статусы.",
    landing_security_note: "ReelFlow Studio использует официальные OAuth 2.0 API. Ваши токены хранятся в зашифрованном виде. Мы никогда не запрашиваем пароли от платформ.",

    // Dashboard
    dash_title: "Обзор",
    dash_subtitle: "Добро пожаловать в ReelFlow Studio",
    dash_uploaded: "Загружено",
    dash_scheduled: "Запланировано",
    dash_published: "Опубликовано",
    dash_errors: "Ошибки",
    dash_recent_videos: "Последние видео",
    dash_no_videos: "Нет загруженных видео",
    dash_connect_hint: "Подключите TikTok в разделе Аккаунты",
    dash_quick_actions: "Быстрые действия",

    // Post
    post_title: "Опубликовать видео",
    post_subtitle: "Загрузите видео — опубликуем в TikTok через официальный API.",
    post_video_file: "Видеофайл",
    post_drop_hint: "Нажмите для выбора файла",
    post_drop_sub: "MP4, MOV, AVI · Макс. 4 ГБ",
    post_video_title: "Название",
    post_video_title_ph: "Например: Весенний лаунч — Ролик 1",
    post_description: "Описание",
    post_description_ph: "Добавьте описание или хэштеги...",
    post_settings: "Настройки публикации",
    post_platforms: "Платформы",
    post_click_platform: "Нажмите на платформу для выбора",
    post_publish: "Опубликовать",
    post_uploading: "Загрузка...",
    post_change_file: "Изменить файл",
    post_no_file: "Сначала выбери видеофайл",
    post_no_platform: "Выбери хотя бы одну платформу",
    post_done: "Готово",
    post_error: "Ошибка загрузки",
    post_tiktok_notice: "Публикация через официальный TikTok API. Требует подключённого аккаунта.",
    post_need_account: "Подключите TikTok аккаунт в разделе Аккаунты, чтобы публиковать видео.",
    post_success: "Видео отправлено в TikTok! Проверьте уведомления в приложении TikTok, чтобы завершить публикацию.",
    post_inbox_notice: "После загрузки видео появится в черновиках TikTok. Откройте уведомление в приложении TikTok чтобы опубликовать.",
    post_thumbnail: "Обложка",
    post_capture_frame: "Взять кадр",
    post_upload_thumb: "Загрузить фото",
    post_privacy: "Видимость",
    post_privacy_select: "Выберите видимость",
    post_privacy_public: "Все пользователи",
    post_privacy_friends: "Взаимные подписчики",
    post_privacy_self: "Только я",
    post_privacy_required: "Выберите видимость перед публикацией",
    post_interactions: "Взаимодействие",
    post_allow_comments: "Комментарии",
    post_allow_duet: "Дуэт",
    post_allow_stitch: "Стич",
    post_commercial: "Рекламный контент",
    post_commercial_hint: "Видео продвигает товары, услуги или бренд",
    post_your_brand: "Свой бренд",
    post_branded_content: "Рекламная интеграция",
    post_branded_content_note: "Рекламная интеграция доступна только с видимостью «Все пользователи»",
    post_branded_content_private_warning: "Видимость «Только я» недоступна для рекламной интеграции",
    post_processing_notice: "После публикации видео может обрабатываться несколько минут",
    post_music_consent: "Я согласен с условиями использования музыки TikTok",
    post_processing: "Видео обрабатывается в TikTok...",
    post_processing_done: "Видео опубликовано в TikTok!",
    post_creator_info_error: "Не удалось загрузить настройки TikTok",

    // Accounts
    acc_title: "Аккаунты",
    acc_subtitle: "Управление OAuth-подключениями к платформам.",
    acc_how_works: "Как работает подключение",
    acc_security_note: "ReelFlow Studio использует официальные OAuth 2.0 API. После подключения ваши токены хранятся в зашифрованном виде. Мы никогда не запрашиваем пароли.",
    acc_loading: "Загрузка профилей...",
    acc_account: "Аккаунт",
    acc_access_type: "Тип доступа",
    acc_rights: "Права",
    acc_token: "Токен",
    acc_connected: "Подключено",
    acc_not_connected: "Не подключено",
    acc_token_active: "Активен",
    acc_token_inactive: "Не подключён",
    acc_connect: "Подключить через OAuth",
    acc_reconnect: "Переподключить",
    acc_disconnect: "Отключить",
    acc_disconnected: "Отключено",
    acc_disconnect_error: "Не удалось отключить",

    // History
    hist_title: "История публикаций",
    hist_subtitle: "Все загруженные видео",
    hist_recent_videos: "Последние видео",
    hist_loading: "Загрузка...",
    hist_no_videos: "Нет загруженных видео",
    hist_status: "Статус",
    hist_date: "Дата",

    // Settings
    set_title: "Настройки",
    set_language: "Язык",
    set_theme: "Тема",
    set_light: "Светлая",
    set_dark: "Тёмная",
    set_save: "Сохранить",
    set_saved: "Сохранено",

    // Common
    loading: "Загрузка...",
    error: "Ошибка",
    save: "Сохранить",
    cancel: "Отмена",
    close: "Закрыть",
    yes: "Да",
    no: "Нет",
    signed_in_as: "Вы вошли как",
  },

  en: {
    // Nav
    nav_home: "Dashboard",
    nav_history: "History",
    nav_post: "Publish",
    nav_repost: "Repost",
    nav_accounts: "Accounts",
    nav_settings: "Settings",
    nav_logout: "Sign Out",
    nav_help: "Help",
    nav_subscription: "Subscription",

    // Auth
    auth_login: "Sign In",
    auth_register: "Sign Up",
    auth_email: "Email",
    auth_password: "Password",
    auth_name: "Name",
    auth_no_account: "No account?",
    auth_have_account: "Already have an account?",
    auth_login_title: "Sign in to ReelFlow Studio",
    auth_register_title: "Create an account",
    auth_signing_in: "Signing in...",
    auth_registering: "Creating account...",
    auth_error_invalid: "Invalid email or password",
    auth_error_email_taken: "This email is already registered",
    auth_error_short_password: "Password must be at least 6 characters",
    auth_error_server: "Server error. Please try again later",

    // Landing
    landing_hero_title: "Publish videos to TikTok\nwith one click",
    landing_hero_subtitle: "ReelFlow Studio is a content automation platform. Connect TikTok via official OAuth and publish videos directly from your browser.",
    landing_cta_start: "Get started free",
    landing_cta_login: "Sign in",
    landing_features_title: "Everything you need to publish",
    landing_feature_1_title: "Secure authorization",
    landing_feature_1_desc: "We use official TikTok OAuth 2.0. No passwords — tokens only.",
    landing_feature_2_title: "Fast uploads",
    landing_feature_2_desc: "Upload videos directly to TikTok via the official API. Up to 4 GB.",
    landing_feature_3_title: "Publication history",
    landing_feature_3_desc: "We store the history of all uploaded videos with statuses.",
    landing_security_note: "ReelFlow Studio uses official OAuth 2.0 APIs. Your tokens are stored encrypted. We never ask for your platform passwords.",

    // Dashboard
    dash_title: "Overview",
    dash_subtitle: "Welcome to ReelFlow Studio",
    dash_uploaded: "Uploaded",
    dash_scheduled: "Scheduled",
    dash_published: "Published",
    dash_errors: "Errors",
    dash_recent_videos: "Recent videos",
    dash_no_videos: "No videos uploaded",
    dash_connect_hint: "Connect TikTok in Accounts section",
    dash_quick_actions: "Quick actions",

    // Post
    post_title: "Publish video",
    post_subtitle: "Upload a video — we'll publish it to TikTok via the official API.",
    post_video_file: "Video file",
    post_drop_hint: "Click to select a file",
    post_drop_sub: "MP4, MOV, AVI · Max 4 GB",
    post_video_title: "Title",
    post_video_title_ph: "e.g. Spring launch — Reel 1",
    post_description: "Description",
    post_description_ph: "Add a description or hashtags...",
    post_settings: "Publish settings",
    post_platforms: "Platforms",
    post_click_platform: "Click a platform to select",
    post_publish: "Publish",
    post_uploading: "Uploading...",
    post_change_file: "Change file",
    post_no_file: "Please select a video file first",
    post_no_platform: "Please select at least one platform",
    post_done: "Done",
    post_error: "Upload error",
    post_tiktok_notice: "Published via the official TikTok API. Requires a connected account.",
    post_need_account: "Connect your TikTok account in the Accounts section to publish videos.",
    post_success: "Video sent to TikTok! Check notifications in the TikTok app to complete publishing.",
    post_inbox_notice: "After uploading, the video will appear in TikTok drafts. Open the notification in the TikTok app to publish.",
    post_thumbnail: "Thumbnail",
    post_capture_frame: "Capture frame",
    post_upload_thumb: "Upload image",
    post_privacy: "Visibility",
    post_privacy_select: "Select visibility",
    post_privacy_public: "Everyone",
    post_privacy_friends: "Mutual followers",
    post_privacy_self: "Only me",
    post_privacy_required: "Please select visibility before publishing",
    post_interactions: "Interactions",
    post_allow_comments: "Comments",
    post_allow_duet: "Duet",
    post_allow_stitch: "Stitch",
    post_commercial: "Commercial content",
    post_commercial_hint: "This video promotes goods, services or a brand",
    post_your_brand: "Your brand",
    post_branded_content: "Branded content",
    post_branded_content_note: "Branded content can only be posted with 'Everyone' visibility",
    post_branded_content_private_warning: "'Only me' visibility is not available for branded content",
    post_processing_notice: "After publishing, video may take a few minutes to process",
    post_music_consent: "I agree to TikTok's Music Usage Confirmation",
    post_processing: "Video is being processed by TikTok...",
    post_processing_done: "Video published to TikTok!",
    post_creator_info_error: "Could not load TikTok settings",

    // Accounts
    acc_title: "Accounts",
    acc_subtitle: "Manage OAuth connections to platforms.",
    acc_how_works: "How connection works",
    acc_security_note: "ReelFlow Studio uses official OAuth 2.0 APIs. After connecting, your tokens are stored encrypted. We never ask for your passwords.",
    acc_loading: "Loading profiles...",
    acc_account: "Account",
    acc_access_type: "Access type",
    acc_rights: "Permissions",
    acc_token: "Token",
    acc_connected: "Connected",
    acc_not_connected: "Not connected",
    acc_token_active: "Active",
    acc_token_inactive: "Not connected",
    acc_connect: "Connect via OAuth",
    acc_reconnect: "Reconnect",
    acc_disconnect: "Disconnect",
    acc_disconnected: "Disconnected",
    acc_disconnect_error: "Failed to disconnect",

    // History
    hist_title: "Publication history",
    hist_subtitle: "All uploaded videos",
    hist_recent_videos: "Recent videos",
    hist_loading: "Loading...",
    hist_no_videos: "No videos uploaded",
    hist_status: "Status",
    hist_date: "Date",

    // Settings
    set_title: "Settings",
    set_language: "Language",
    set_theme: "Theme",
    set_light: "Light",
    set_dark: "Dark",
    set_save: "Save",
    set_saved: "Saved",

    // Common
    loading: "Loading...",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    yes: "Yes",
    no: "No",
    signed_in_as: "Signed in as",
  },
};

// Get browser/stored language
function getDefaultLang() {
  const stored = localStorage.getItem("rf_lang");
  if (stored === "ru" || stored === "en") return stored;
  const browser = navigator.language || "en";
  return browser.startsWith("ru") ? "ru" : "en";
}

let currentLang = getDefaultLang();
let listeners = [];

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang === "ru" ? "ru" : "en";
  localStorage.setItem("rf_lang", currentLang);
  listeners.forEach((fn) => fn(currentLang));
}

export function onLangChange(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

export function t(key) {
  return translations[currentLang]?.[key] || translations.en?.[key] || key;
}
