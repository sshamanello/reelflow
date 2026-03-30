// src/worker.js

/* -------------------- utils -------------------- */

// Password hashing via Web Crypto (PBKDF2)
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return b64url(new Uint8Array(bits));
}

async function verifyPassword(password, salt, hash) {
  const h = await hashPassword(password, salt);
  return h === hash;
}


function makeCORS(env, origin) {
  // Используем ALLOWED_ORIGINS из wrangler.toml или значение по умолчанию
  const allowed = env.ALLOWED_ORIGINS || "https://sshamanello.ru";

  // Проверяем если origin в списке разрешенных
  const allowedList = allowed.split(",").map(o => o.trim());
  const isAllowed = !origin || allowedList.includes(origin) || allowedList.includes("*");

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || allowedList[0]) : "null",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(data, cors, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors, ...extraHeaders },
  });
}

function getCookie(req, name) {
  const c = req.headers.get("Cookie") || "";
  const m = c.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function cookieSerialize(name, val, days = 30) {
  const expires = new Date(Date.now() + days * 86400e3).toUTCString();
  return `${name}=${val}; Path=/; HttpOnly; SameSite=None; Secure; Expires=${expires}`;
}

function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function randomId(len = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(len)));
}

async function getSession(env, sid) {
  if (!sid) return null;
  const raw = await env.SESSIONS.get(`sid:${sid}`);
  return raw ? JSON.parse(raw) : null;
}

async function putSession(env, sid, obj) {
  await env.SESSIONS.put(`sid:${sid}`, JSON.stringify(obj), {
    expirationTtl: 60 * 60 * 24 * 30,
  });
}

function getSidFromReq(req, env) {
  const auth = req.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  const xs = req.headers.get("X-Session");
  if (xs) return xs.trim();
  return getCookie(req, env.COOKIE_NAME || "rf_sid");
}

function normalizeProfile(u = {}) {
  const avatar =
    u.avatar_url ||
    u.avatar_url_100 ||
    u.avatar_large_url ||
    (Array.isArray(u.avatars) ? u.avatars[0] : null) ||
    u.avatarLarge || u.avatarMedium || u.avatarThumb || u.avatar || null;

  // В basic может не быть username/profile_deep_link — делаем "handle" из display_name
  let handle = u.username || u.handle || null;
  const display = u.display_name || u.nickname || u.full_name || u.name || u.open_id || "Creator";

  if (!handle) {
    handle = display ? display.toString().replace(/\s+/g, "_").toLowerCase() : (u.open_id || "your_handle");
  }
  if (handle && !handle.startsWith("@")) handle = `@${handle}`;

  return {
    open_id: u.open_id || null,
    display_name: display,
    avatar_url: avatar,
    profile_deep_link: u.profile_deep_link || null, // может быть null в basic — ок
    handle,
    username: handle,
    // Статистика (если доступна) - TikTok может возвращать stats_data
    stats: u.stats_data || u.stats || null,
    followers_count: u.stats_data?.followers_count || u.follower_count || u.followers_count || null,
  };
}

/* -------------------- TikTok helpers -------------------- */

async function tiktokTokenByCode(env, { code, redirect_uri, code_verifier }) {
  const form = new URLSearchParams();
  form.set("client_key", env.TIKTOK_CLIENT_KEY);
  form.set("client_secret", env.TIKTOK_CLIENT_SECRET);
  form.set("grant_type", "authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirect_uri);
  if (code_verifier) form.set("code_verifier", code_verifier);

  console.log("Token flow:", "CONFIDENTIAL");
  console.log(
    "Token request form:",
    `client_key=${env.TIKTOK_CLIENT_KEY}&client_secret=[REDACTED]&grant_type=authorization_code&code=[REDACTED]&redirect_uri=${redirect_uri}`
  );

  const url = "https://open.tiktokapis.com/v2/oauth/token/"; // со слэшем
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const bodyText = await resp.text();
  console.log("TikTok token response status:", resp.status);
  console.log("TikTok token response body:", bodyText);

  let json;
  try { json = JSON.parse(bodyText); } catch { throw new Error(`token_parse_failed: ${bodyText}`); }
  if (!resp.ok || json?.error) throw new Error(`token_exchange_failed: ${bodyText}`);

  return json.data || json;
}

// Helper: get a valid (auto-refreshed) TikTok access token from session
async function getValidTikTokToken(env, sid, sess) {
  let { access_token, refresh_token, expires_at } = sess.tiktok || {};
  if (!access_token) return null;
  const now = Math.floor(Date.now() / 1000);
  if (expires_at && now > (expires_at - 60) && refresh_token) {
    try {
      const r = await tiktokRefresh(env, refresh_token);
      access_token  = r.access_token  || access_token;
      refresh_token = r.refresh_token || refresh_token;
      expires_at    = now + (r.expires_in || 3600);
      sess.tiktok   = { access_token, refresh_token, expires_at, scope: sess.tiktok.scope };
      await putSession(env, sid, sess);
    } catch (e) {
      console.error("TikTok token refresh failed:", e);
    }
  }
  return access_token;
}

async function tiktokRefresh(env, refresh_token) {
  const form = new URLSearchParams();
  form.set("client_key", env.TIKTOK_CLIENT_KEY);
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", refresh_token);

  const url = "https://open.tiktokapis.com/v2/oauth/token/"; // со слэшем
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`refresh_failed: ${t}`);
  let j = {};
  try { j = JSON.parse(t); } catch {}
  return j.data || j;
}

// user.info.basic
// ЗАМЕНИ ЭТУ ФУНКЦИЮ ЦЕЛИКОМ

async function tiktokMe(access_token) {
  // ⚠️ Запрашиваем ТОЛЬКО поля, доступные по user.info.basic
  const fieldsBasic = [
    "open_id",
    "union_id",
    "avatar_url",
    "avatar_url_100",
    "avatar_large_url",
    "display_name",
  ];

  // основной: GET (в v2 — норм, главное передать fields)
  try {
    const qs = new URLSearchParams();
    qs.set("fields", fieldsBasic.join(","));
    const url = `https://open.tiktokapis.com/v2/user/info/?${qs.toString()}`;

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json",
      },
    });

    const text = await resp.text();
    console.log("TikTok user/info GET status:", resp.status, "body:", text);

    if (!resp.ok) {
      return { __error: true, status: resp.status, body: text };
    }

    const j = JSON.parse(text);
    const u = j?.data?.user || j?.data || {};

    // Логируем что у нас есть до нормализации
    console.log("TikTok user data before normalize:", JSON.stringify(u));

    // нормализуем, НЕ рассчитываем на username/profile_deep_link (их нет в basic)
    const normalized = normalizeProfile(u);
    console.log("TikTok user data after normalize:", JSON.stringify(normalized));

    return normalized;
  } catch (e) {
    return { __error: true, status: 0, body: String(e?.message || e) };
  }
}

/* -------------------- YouTube (Google OAuth) helpers -------------------- */

async function youtubeTokenByCode(env, { code, redirect_uri }) {
  const form = new URLSearchParams();
  form.set("client_id", env.GOOGLE_CLIENT_ID);
  form.set("client_secret", env.GOOGLE_CLIENT_SECRET);
  form.set("grant_type", "authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirect_uri);

  console.log("YouTube token exchange...");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const bodyText = await resp.text();
  console.log("YouTube token response status:", resp.status);

  if (!resp.ok) {
    throw new Error(`youtube_token_failed: ${bodyText}`);
  }

  return JSON.parse(bodyText);
}

async function youtubeRefresh(env, refresh_token) {
  const form = new URLSearchParams();
  form.set("client_id", env.GOOGLE_CLIENT_ID);
  form.set("client_secret", env.GOOGLE_CLIENT_SECRET);
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", refresh_token);

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!resp.ok) {
    throw new Error(`youtube_refresh_failed`);
  }

  return await resp.json();
}

async function youtubeMe(access_token) {
  try {
    const resp = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json",
      },
    });

    const text = await resp.text();
    console.log("YouTube channels response status:", resp.status);

    if (!resp.ok) {
      return { __error: true, status: resp.status, body: text };
    }

    const j = JSON.parse(text);
    const channel = j?.items?.[0];

    if (!channel) {
      return { __error: true, status: 404, body: "No channel found" };
    }

    return {
      platform: 'youtube',
      channel_id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails?.default?.url || channel.snippet.thumbnails?.medium?.url,
      subscriber_count: channel.statistics?.subscriberCount,
      video_count: channel.statistics?.videoCount,
      view_count: channel.statistics?.viewCount,
    };
  } catch (e) {
    return { __error: true, status: 0, body: String(e?.message || e) };
  }
}


/* -------------------- handlers -------------------- */

async function handleExchange(req, env, cors) {
  try {
    const body = await req.json();
    console.log("Exchange request body:", JSON.stringify(body));

    const { code, redirect_uri, platform, code_verifier } = body;
    if (!code) return json({ error: "missing_code" }, cors, 400);
    if (!redirect_uri) return json({ error: "missing_redirect_uri" }, cors, 400);
    if (!platform) return json({ error: "missing_platform" }, cors, 400);

    const incomingSid = getSidFromReq(req, env);
    const sid = incomingSid || (await randomId());

    // Get existing session
    const sess = (incomingSid ? await getSession(env, sid) : null) || {};

    let platformData = {};
    let profile = null;

    if (platform === 'tiktok') {
      // 1) обмен кода на токен
      const token = await tiktokTokenByCode(env, { code, redirect_uri, code_verifier });
      const access_token  = token?.access_token;
      const refresh_token = token?.refresh_token;
      const expires_in    = token?.expires_in || 3600;
      const token_scope   = token?.scope || "";

      if (!access_token) {
        return json({ error: "no_access_token", token_response: token }, cors, 400);
      }

      const now = Math.floor(Date.now() / 1000);
      platformData = {
        access_token,
        refresh_token,
        expires_at: now + expires_in,
        scope: token_scope,
      };

      sess.tiktok = platformData;

      // Сохраняем токен по userId чтобы он не терялся при логауте/логине
      if (sess.userId) {
        await env.SESSIONS.put(`tiktok_token:${sess.userId}`, JSON.stringify(platformData), {
          expirationTtl: 60 * 60 * 24 * 60,
        });
      }

      // 3) профиль
      profile = await tiktokMe(access_token);

    } else if (platform === 'youtube') {
      // YouTube token exchange
      const token = await youtubeTokenByCode(env, { code, redirect_uri });
      const access_token  = token?.access_token;
      const refresh_token = token?.refresh_token;
      const expires_in    = token?.expires_in || 3600;

      if (!access_token) {
        return json({ error: "no_access_token", token_response: token }, cors, 400);
      }

      const now = Math.floor(Date.now() / 1000);
      platformData = {
        access_token,
        refresh_token,
        expires_at: now + expires_in,
      };

      sess.youtube = platformData;

      // Get YouTube profile
      profile = await youtubeMe(access_token);
    }

    // Save session
    await putSession(env, sid, sess);

    const baseHeaders = {
      ...cors,
      "Content-Type": "application/json",
      "Set-Cookie": cookieSerialize(env.COOKIE_NAME || "rf_sid", sid, Number(env.COOKIE_TTL_DAYS || 30)),
    };

    if (profile && !profile.__error) {
      return new Response(JSON.stringify({
        ok: true,
        profile: { ...profile, platform },
        sid,
      }), {
        status: 200, headers: baseHeaders
      });
    } else {
      return new Response(JSON.stringify({
        ok: true,
        sid,
        platform,
        profile_error: profile,
      }), {
        status: 200, headers: baseHeaders
      });
    }
  } catch (e) {
    console.error("Exchange error:", e);
    return json({ error: "exchange_failed", message: e.message, stack: e.stack }, cors, 500);
  }
}


async function handleMe(req, env, cors) {
  const sid = getSidFromReq(req, env);
  console.log("handleMe sid:", sid);

  const sess = await getSession(env, sid);
  console.log("handleMe session:", sess ? "found" : "not found");
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const profiles = {};

  // TikTok profile
  if (sess.tiktok) {
    let { access_token, refresh_token, expires_at } = sess.tiktok;
    const now = Math.floor(Date.now() / 1000);

    if (expires_at && now > (expires_at - 60) && refresh_token) {
      try {
        const r = await tiktokRefresh(env, refresh_token);
        access_token = r.access_token || access_token;
        refresh_token = r.refresh_token || refresh_token;
        expires_at = now + (r.expires_in || 3600);
        sess.tiktok = { access_token, refresh_token, expires_at };
        await putSession(env, sid, sess);
      } catch (e) {
        console.error("TikTok refresh error:", e);
      }
    }

    const tiktokProf = await tiktokMe(access_token);
    if (!tiktokProf?.__error) {
      profiles.tiktok = { ...tiktokProf, platform: 'tiktok' };
    }
  }

  // YouTube profile
  if (sess.youtube) {
    let { access_token, refresh_token, expires_at } = sess.youtube;
    const now = Math.floor(Date.now() / 1000);

    if (expires_at && now > (expires_at - 60) && refresh_token) {
      try {
        const r = await youtubeRefresh(env, refresh_token);
        access_token = r.access_token || access_token;
        refresh_token = r.refresh_token || refresh_token;
        expires_at = now + (r.expires_in || 3600);
        sess.youtube = { access_token, refresh_token, expires_at };
        await putSession(env, sid, sess);
      } catch (e) {
        console.error("YouTube refresh error:", e);
      }
    }

    const youtubeProf = await youtubeMe(access_token);
    if (!youtubeProf?.__error) {
      profiles.youtube = youtubeProf;
    }
  }

  return json({ profiles }, cors, 200);
}

/* -------------------- logout -------------------- */

async function handleLogout(req, env, cors) {
  const sid = getSidFromReq(req, env);
  console.log("handleLogout sid:", sid);

  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  try {
    const body = await req.json();
    const platform = body?.platform;

    if (!platform || (platform !== 'tiktok' && platform !== 'youtube')) {
      return json({ error: "invalid_platform" }, cors, 400);
    }

    // Удаляем токен платформы из сессии и из постоянного хранилища
    if (platform === 'tiktok') {
      delete sess.tiktok;
      if (sess.userId) {
        await env.SESSIONS.delete(`tiktok_token:${sess.userId}`);
      }
    } else if (platform === 'youtube') {
      delete sess.youtube;
    }

    // Обновляем сессию
    await putSession(env, sid, sess);

    return json({ success: true, platform }, cors, 200);
  } catch (e) {
    console.error("handleLogout error:", e);
    return json({ error: "server_error" }, cors, 500);
  }
}

/* -------------------- creator info -------------------- */

async function handleCreatorInfo(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const access_token = await getValidTikTokToken(env, sid, sess);
  if (!access_token) return json({ error: "no_tiktok_token" }, cors, 401);

  const resp = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({}),
  });

  const text = await resp.text();
  console.log("creator_info status:", resp.status, "body:", text);
  let data = {};
  try { data = JSON.parse(text); } catch {}

  if (!resp.ok) return json({ error: "creator_info_failed", detail: data }, cors, resp.status);
  return json(data?.data || data, cors, 200);
}

/* -------------------- publish status -------------------- */

async function handlePublishStatus(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const url = new URL(req.url);
  const publish_id = url.searchParams.get("publish_id");
  if (!publish_id) return json({ error: "missing_publish_id" }, cors, 400);

  const access_token = sess.tiktok?.access_token;
  if (!access_token) return json({ error: "no_tiktok_token" }, cors, 401);

  const resp = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id }),
  });

  const text = await resp.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  return json(data?.data || data, cors, resp.status);
}

/* -------------------- upload v2: init / chunk / complete -------------------- */

async function handleUploadInit(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const access_token = await getValidTikTokToken(env, sid, sess);
  if (!access_token) return json({ error: "no_tiktok_token" }, cors, 401);

  const body = await req.json();
  const {
    title, privacy_level, disable_comment, disable_duet, disable_stitch,
    brand_content_toggle, brand_organic_toggle, cover_timestamp_ms,
    file_size, file_mime,
  } = body;

  if (!file_size || file_size <= 0) return json({ error: "invalid_file_size" }, cors, 400);

  // TikTok requires chunk_size * total_chunk_count == video_size exactly.
  // Safest: single chunk (total_chunk_count=1, chunk_size=video_size).
  const chunk_size = file_size;
  const total_chunk_count = 1;

  const sourceInfo = {
    source: "FILE_UPLOAD",
    video_size: file_size,
    chunk_size,
    total_chunk_count,
  };

  const postInfo = {
    title: (title || "My video").slice(0, 150),
    privacy_level: privacy_level || "SELF_ONLY",
    disable_duet: !!disable_duet,
    disable_comment: !!disable_comment,
    disable_stitch: !!disable_stitch,
    video_cover_timestamp_ms: cover_timestamp_ms ?? 0,
    brand_content_toggle: !!brand_content_toggle,
    brand_organic_toggle: !!brand_organic_toggle,
  };

  // Try Direct Post first
  let upload_url, publish_id, use_inbox = false;

  const directResp = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json; charset=UTF-8", Accept: "application/json" },
    body: JSON.stringify({ post_info: postInfo, source_info: sourceInfo }),
  });
  const directText = await directResp.text();
  console.log("Direct Post INIT:", directResp.status, directText);
  let directJson = {};
  try { directJson = JSON.parse(directText); } catch {}
  const directOk = directResp.ok && (!directJson.error || directJson.error.code === "ok");

  if (directOk) {
    upload_url = directJson?.data?.upload_url;
    publish_id = directJson?.data?.publish_id;
  } else {
    // Fallback: Inbox API
    use_inbox = true;
    const inboxResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json; charset=UTF-8", Accept: "application/json" },
      body: JSON.stringify({ source_info: sourceInfo }),
    });
    const inboxText = await inboxResp.text();
    console.log("Inbox INIT:", inboxResp.status, inboxText);
    let inboxJson = {};
    try { inboxJson = JSON.parse(inboxText); } catch {}
    const inboxOk = inboxResp.ok && (!inboxJson.error || inboxJson.error.code === "ok");

    if (!inboxOk) {
      const tiktok_error   = inboxJson?.error?.code    || directJson?.error?.code    || "init_failed";
      const tiktok_message = inboxJson?.error?.message || directJson?.error?.message || "";
      // Friendly messages for known error codes
      const friendly = {
        "access_token_invalid":                          "Токен TikTok устарел. Отключите и переподключите TikTok аккаунт.",
        "scope_not_authorized":                          "Нет разрешения на публикацию. Переподключите TikTok аккаунт.",
        "unaudited_client_can_only_post_to_private_accounts": "Приложение ещё не прошло аудит TikTok. Выберите видимость «Только я».",
        "spam_risk_too_many_posts":                      "Достигнут дневной лимит публикаций TikTok. Попробуйте завтра.",
        "spam_risk_user_banned_from_posting":            "Ваш аккаунт временно ограничен TikTok.",
        "reached_active_user_cap":                       "Достигнут дневной лимит пользователей приложения.",
        "privacy_level_option_mismatch":                 "Выбранный уровень приватности недоступен для вашего аккаунта.",
      };
      return json({
        error: "init_failed",
        tiktok_error,
        tiktok_message: friendly[tiktok_error] || tiktok_message,
        detail: inboxJson,
      }, cors, 400);
    }
    upload_url = inboxJson?.data?.upload_url;
    publish_id = inboxJson?.data?.publish_id;
  }

  if (!upload_url || !publish_id) return json({ error: "init_missing_fields" }, cors, 400);

  // Store upload state in KV (2 hours TTL)
  // Normalise mime: TikTok accepts video/mp4, video/quicktime, video/webm only
  const allowed = ["video/mp4", "video/quicktime", "video/webm"];
  const mime = allowed.includes(file_mime) ? file_mime : "video/mp4";
  await env.SESSIONS.put(
    `upload:${publish_id}`,
    JSON.stringify({ upload_url, use_inbox, mime }),
    { expirationTtl: 7200 }
  );

  return json({ publish_id, chunk_size, total_chunks: total_chunk_count, use_inbox }, cors, 200);
}

async function handleUploadChunk(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const publishId  = req.headers.get("x-publish-id");
  const chunkStart = Number(req.headers.get("x-chunk-start") || 0);
  const totalSize  = Number(req.headers.get("x-total-size") || 0);

  if (!publishId) return json({ error: "missing_publish_id" }, cors, 400);

  const stateRaw = await env.SESSIONS.get(`upload:${publishId}`);
  if (!stateRaw) return json({ error: "upload_session_not_found" }, cors, 404);
  const { upload_url, mime } = JSON.parse(stateRaw);

  const chunk = await req.arrayBuffer();
  const chunkEnd = chunkStart + chunk.byteLength - 1;

  // TikTok requires video/mp4, video/quicktime, or video/webm — not application/octet-stream
  const putResp = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": mime || "video/mp4",
      "Content-Length": String(chunk.byteLength),
      "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${totalSize}`,
    },
    body: chunk,
  });

  if (!(putResp.ok || putResp.status === 206 || putResp.status === 201)) {
    const putText = await putResp.text().catch(() => "");
    console.log("Chunk PUT failed:", putResp.status, putText);
    return json({ error: "chunk_upload_failed", status: putResp.status, body: putText }, cors, 502);
  }

  return json({ ok: true }, cors, 200);
}

async function handleUploadComplete(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const access_token = sess.tiktok?.access_token;
  const { publish_id, video_name } = await req.json();

  const stateRaw = await env.SESSIONS.get(`upload:${publish_id}`);
  if (!stateRaw) return json({ error: "upload_session_not_found" }, cors, 404);
  const { use_inbox } = JSON.parse(stateRaw);

  // Inbox: send to drafts
  if (use_inbox) {
    const publishResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/publish/", {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ publish_id }),
    });
    const publishText = await publishResp.text();
    console.log("Inbox PUBLISH:", publishResp.status, publishText);
  }

  // Persist video record per user (survives re-login)
  const videosKey = `videos:${sess.userId}`;
  const raw = await env.SESSIONS.get(videosKey);
  const videos = raw ? JSON.parse(raw) : [];
  videos.push({
    id: Date.now(),
    name: video_name || "Untitled",
    publishId: publish_id,
    status: use_inbox ? "uploaded" : "processing",
    createdAt: new Date().toISOString(),
  });
  await env.SESSIONS.put(videosKey, JSON.stringify(videos), { expirationTtl: 60 * 60 * 24 * 60 });

  // Clean up upload state
  await env.SESSIONS.delete(`upload:${publish_id}`);

  return json({ status: use_inbox ? "uploaded_to_inbox" : "processing", publish_id }, cors, 200);
}

/* -------------------- upload (Direct Post API) -------------------- */

async function handleUpload(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const access_token = sess.tiktok?.access_token;
  if (!access_token) {
    return json({ error: "no_tiktok_token", message: "Please connect TikTok account first" }, cors, 401);
  }

  // 1) form-data
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return json({ error: "no_file", message: "Provide a video file in form-data: file=<blob>" }, cors, 400);
  }
  const mime = file.type || "video/mp4";
  const size = Number(file.size || 0);
  if (!Number.isFinite(size) || size <= 0) {
    return json({ error: "invalid_file_size", message: "File size must be > 0" }, cors, 400);
  }
  const buf = new Uint8Array(await file.arrayBuffer());

  // 2) post metadata from form
  const postTitle = (form.get("title") || "My video").slice(0, 150);
  const privacyLevel = form.get("privacy_level") || "SELF_ONLY";
  const disableComment = form.get("disable_comment") === "true";
  const disableDuet = form.get("disable_duet") === "true";
  const disableStitch = form.get("disable_stitch") === "true";
  const brandContentToggle = form.get("brand_content_toggle") === "true";
  const brandOrganicToggle = form.get("brand_organic_toggle") === "true";
  const coverTimestampMs = Number(form.get("cover_timestamp_ms") || 0);

  // 3) chunk calc
  const FIVE_MB = 5 * 1024 * 1024;
  const baseChunk = (size < FIVE_MB) ? size : FIVE_MB;
  const totalChunks = Math.max(1, Math.floor(size / baseChunk));
  const remainder = size - (baseChunk * totalChunks);

  // 4) INIT — Direct Post API
  const initBody = {
    post_info: {
      title: postTitle,
      privacy_level: privacyLevel,
      disable_duet: disableDuet,
      disable_comment: disableComment,
      disable_stitch: disableStitch,
      video_cover_timestamp_ms: coverTimestampMs,
      brand_content_toggle: brandContentToggle,
      brand_organic_toggle: brandOrganicToggle,
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: size,
      chunk_size: baseChunk,
      total_chunk_count: totalChunks,
    },
  };

  // 4) Try Direct Post API first, fall back to Inbox if not approved yet
  let uploadUrl, publishId, useInbox = false;

  console.log("Direct Post INIT body:", JSON.stringify(initBody));
  const directResp = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(initBody),
  });

  const directText = await directResp.text();
  console.log("Direct Post INIT status:", directResp.status, "body:", directText);

  let directJson = {};
  try { directJson = JSON.parse(directText); } catch {}
  const directOk = directResp.ok && (!directJson.error || directJson.error.code === "ok");

  if (directOk) {
    uploadUrl = directJson?.data?.upload_url;
    publishId = directJson?.data?.publish_id;
  } else {
    // Direct Post not approved yet — fall back to Inbox API
    console.log("Direct Post failed, falling back to Inbox API...");
    useInbox = true;

    const inboxBody = {
      source_info: {
        source: "FILE_UPLOAD",
        video_size: size,
        chunk_size: baseChunk,
        total_chunk_count: totalChunks,
      },
    };

    const inboxResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
        Accept: "application/json",
      },
      body: JSON.stringify(inboxBody),
    });

    const inboxText = await inboxResp.text();
    console.log("Inbox INIT status:", inboxResp.status, "body:", inboxText);

    let inboxJson = {};
    try { inboxJson = JSON.parse(inboxText); } catch {}
    const inboxOk = inboxResp.ok && (!inboxJson.error || inboxJson.error.code === "ok");
    if (!inboxOk) {
      return json({ error: "init_failed", status: inboxResp.status, detail: inboxJson || inboxText }, cors, 400);
    }

    uploadUrl = inboxJson?.data?.upload_url;
    publishId = inboxJson?.data?.publish_id;
  }

  if (!uploadUrl || !publishId) {
    return json({ error: "init_missing_fields" }, cors, 400);
  }

  // 5) PUT chunks
  let offset = 0;
  for (let i = 0; i < totalChunks; i++) {
    const isLast = (i === totalChunks - 1);
    const thisLen = isLast ? (baseChunk + remainder) : baseChunk;
    const start = offset;
    const end = start + thisLen - 1;
    const chunk = buf.slice(start, end + 1);

    const putResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        Accept: "application/json",
      },
      body: chunk,
    });

    if (!(putResp.ok || putResp.status === 206 || putResp.status === 201)) {
      const putText = await putResp.text().catch(() => "");
      console.log("Chunk PUT failed:", putResp.status, putText);
      return json({ error: "chunk_upload_failed", status: putResp.status, range: `bytes ${start}-${end}/${size}`, body: putText, publish_id: publishId }, cors, 502);
    }

    offset = end + 1;
  }

  // 6) Inbox: publish to drafts; Direct: TikTok processes async
  if (useInbox) {
    const publishResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/publish/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
        Accept: "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const publishText = await publishResp.text();
    console.log("Inbox PUBLISH status:", publishResp.status, "body:", publishText);
    return json({ status: "uploaded_to_inbox", publish_id: publishId }, cors, 200);
  }

  return json({ status: "processing", publish_id: publishId }, cors, 200);
}

/* -------------------- YouTube upload -------------------- */

// POST /api/youtube/upload — загрузка видео на YouTube через resumable upload
async function handleYoutubeUpload(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const access_token = sess.youtube?.access_token;
  if (!access_token) {
    return json({ error: "no_youtube_token", message: "Please connect YouTube account first" }, cors, 401);
  }

  try {
    // 1) Получаем файл из form-data
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return json({ error: "no_file", message: "Provide a video file in form-data: file=<blob>" }, cors, 400);
    }

    const mime = file.type || "video/mp4";
    const size = Number(file.size || 0);
    if (!Number.isFinite(size) || size <= 0) {
      return json({ error: "invalid_file_size", message: "File size must be > 0" }, cors, 400);
    }

    console.log("[YouTube Upload] File size:", size, "MIME:", mime);

    // 2) Инициализируем resumable upload session
    const initBody = {
      snippet: {
        title: form.get("title") || "ReelFlow Upload",
        description: form.get("description") || "",
        categoryId: "22", // People & Blogs
        defaultLanguage: "en",
        defaultAudioLanguage: "en"
      },
      status: {
        privacyStatus: form.get("privacy") || "public", // public, private, unlisted
        selfDeclaredMadeForKids: false
      }
    };

    // Добавляем теги если есть
    const tags = form.get("tags");
    if (tags) {
      initBody.snippet.tags = tags.split(",").map(t => t.trim()).filter(t => t);
    }

    console.log("[YouTube Upload] Init request:", JSON.stringify(initBody, null, 2));

    const initResp = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,contentDetails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Length": String(size),
        "X-Upload-Content-Type": mime
      },
      body: JSON.stringify(initBody)
    });

    if (!initResp.ok) {
      const errorText = await initResp.text();
      console.error("[YouTube Upload] Init failed:", initResp.status, errorText);
      return json({ error: "youtube_init_failed", status: initResp.status, detail: errorText }, cors, initResp.status);
    }

    // 3) Получаем upload URL из заголовков
    const uploadUrl = initResp.headers.get("Location");
    if (!uploadUrl) {
      return json({ error: "no_upload_url", message: "YouTube did not return upload URL" }, cors, 500);
    }

    console.log("[YouTube Upload] Got upload URL:", uploadUrl);

    // 4) Загружаем видео
    const buf = new Uint8Array(await file.arrayBuffer());
    const uploadResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": mime,
        "Content-Length": String(size)
      },
      body: buf
    });

    if (!uploadResp.ok) {
      const errorText = await uploadResp.text();
      console.error("[YouTube Upload] Upload failed:", uploadResp.status, errorText);
      return json({ error: "youtube_upload_failed", status: uploadResp.status, detail: errorText }, cors, uploadResp.status);
    }

    // 5) Получаем информацию о загруженном видео
    const videoData = await uploadResp.json();
    console.log("[YouTube Upload] Success! Video ID:", videoData.id);

    return json({
      success: true,
      publish_id: videoData.id,
      video_id: videoData.id,
      platform: "youtube",
      upload_url: `https://www.youtube.com/watch?v=${videoData.id}`
    }, cors, 200);

  } catch (e) {
    console.error("[YouTube Upload] Error:", e);
    return json({ error: "upload_error", message: e?.message || String(e) }, cors, 500);
  }
}

/* -------------------- projects & videos -------------------- */

async function handleGetProjects(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sid || !sess) return json({ error: "unauthorized" }, cors, 401);

  const projectsKey = `projects:${sid}`;
  const raw = await env.SESSIONS.get(projectsKey);
  const projects = raw ? JSON.parse(raw) : [];

  return json({ projects }, cors, 200);
}

async function handleCreateProject(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sid || !sess) return json({ error: "unauthorized" }, cors, 401);

  const body = await req.json();
  const { name, platforms } = body;

  if (!name) return json({ error: "missing_name" }, cors, 400);
  if (!platforms || !Array.isArray(platforms)) return json({ error: "missing_platforms" }, cors, 400);

  const projectsKey = `projects:${sid}`;
  const raw = await env.SESSIONS.get(projectsKey);
  const projects = raw ? JSON.parse(raw) : [];

  const newProject = {
    id: Date.now(),
    name,
    platforms,
    videos: 0,
    lastActive: 'just_now',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  projects.push(newProject);
  await env.SESSIONS.put(projectsKey, JSON.stringify(projects), {
    expirationTtl: 60 * 60 * 24 * 30,
  });

  return json({ project: newProject }, cors, 201);
}

async function handleGetVideos(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sid || !sess) return json({ error: "unauthorized" }, cors, 401);

  const videosKey = `videos:${sess.userId}`;
  const raw = await env.SESSIONS.get(videosKey);
  const videos = raw ? JSON.parse(raw) : [];

  return json({ videos }, cors, 200);
}

async function handleSaveVideo(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sid || !sess) return json({ error: "unauthorized" }, cors, 401);

  const body = await req.json();
  const { projectId, videoName, publishId, status } = body;

  const videosKey = `videos:${sess.userId}`;
  const raw = await env.SESSIONS.get(videosKey);
  const videos = raw ? JSON.parse(raw) : [];

  const newVideo = {
    id: Date.now(),
    projectId,
    name: videoName || 'Untitled',
    publishId,
    status: status || 'uploaded',
    createdAt: new Date().toISOString(),
  };

  videos.push(newVideo);
  await env.SESSIONS.put(videosKey, JSON.stringify(videos), {
    expirationTtl: 60 * 60 * 24 * 30,
  });

  // Update project video count
  const projectsKey = `projects:${sid}`;
  const projectsRaw = await env.SESSIONS.get(projectsKey);
  if (projectsRaw) {
    const projects = JSON.parse(projectsRaw);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.videos = (project.videos || 0) + 1;
      project.lastActive = 'just_now';
      await env.SESSIONS.put(projectsKey, JSON.stringify(projects), {
        expirationTtl: 60 * 60 * 24 * 30,
      });
    }
  }

  return json({ video: newVideo }, cors, 201);
}

async function handleGetStats(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sid || !sess) return json({ error: "unauthorized" }, cors, 401);

  const videosKey = `videos:${sess.userId}`;
  const raw = await env.SESSIONS.get(videosKey);
  const videos = raw ? JSON.parse(raw) : [];

  const uploaded = videos.filter(v => v.status === 'uploaded').length;
  const published = videos.filter(v => v.status === 'published').length;
  const errors = videos.filter(v => v.status === 'failed').length;
  const scheduled = videos.filter(v => v.status === 'scheduled').length;

  return json({
    uploaded,
    scheduled,
    published,
    errors,
  }, cors, 200);
}

/* -------------------- user auth -------------------- */

async function handleRegister(req, env, cors) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) return json({ error: "missing_fields" }, cors, 400);
    if (password.length < 6) return json({ error: "password_too_short" }, cors, 400);

    const emailKey = `user:email:${email.toLowerCase().trim()}`;
    const existing = await env.SESSIONS.get(emailKey);
    if (existing) return json({ error: "email_taken" }, cors, 409);

    const userId = await randomId(16);
    const salt = await randomId(16);
    const pwHash = await hashPassword(password, salt);

    const user = {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name || email.split("@")[0],
      salt,
      pwHash,
      createdAt: new Date().toISOString(),
    };

    // Store user record
    await env.SESSIONS.put(`user:${userId}`, JSON.stringify(user), { expirationTtl: 60 * 60 * 24 * 365 });
    // Store email -> userId index
    await env.SESSIONS.put(emailKey, userId, { expirationTtl: 60 * 60 * 24 * 365 });

    // Create session
    const sid = await randomId();
    const sess = { userId, email: user.email, name: user.name };
    await putSession(env, sid, sess);

    return new Response(JSON.stringify({ ok: true, user: { id: userId, email: user.email, name: user.name }, sid }), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Set-Cookie": cookieSerialize(env.COOKIE_NAME || "rf_sid", sid, Number(env.COOKIE_TTL_DAYS || 30)),
      },
    });
  } catch (e) {
    console.error("Register error:", e);
    return json({ error: "server_error", message: e.message }, cors, 500);
  }
}

async function handleLogin(req, env, cors) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) return json({ error: "missing_fields" }, cors, 400);

    const emailKey = `user:email:${email.toLowerCase().trim()}`;
    const userId = await env.SESSIONS.get(emailKey);
    if (!userId) return json({ error: "invalid_credentials" }, cors, 401);

    const userRaw = await env.SESSIONS.get(`user:${userId}`);
    if (!userRaw) return json({ error: "invalid_credentials" }, cors, 401);

    const user = JSON.parse(userRaw);
    const valid = await verifyPassword(password, user.salt, user.pwHash);
    if (!valid) return json({ error: "invalid_credentials" }, cors, 401);

    const sid = await randomId();
    const sess = { userId: user.id, email: user.email, name: user.name };

    // Восстанавливаем TikTok токен если он был сохранён ранее
    const savedTiktok = await env.SESSIONS.get(`tiktok_token:${user.id}`);
    if (savedTiktok) {
      try { sess.tiktok = JSON.parse(savedTiktok); } catch {}
    }

    await putSession(env, sid, sess);

    return new Response(JSON.stringify({ ok: true, user: { id: user.id, email: user.email, name: user.name }, sid }), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Set-Cookie": cookieSerialize(env.COOKIE_NAME || "rf_sid", sid, Number(env.COOKIE_TTL_DAYS || 30)),
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return json({ error: "server_error", message: e.message }, cors, 500);
  }
}

async function handleUserLogout(req, env, cors) {
  const sid = getSidFromReq(req, env);
  if (sid) {
    await env.SESSIONS.delete(`sid:${sid}`);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Set-Cookie": `${env.COOKIE_NAME || "rf_sid"}=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0`,
    },
  });
}

async function handleGetUser(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess || !sess.userId) return json({ error: "unauthorized" }, cors, 401);
  return json({ user: { id: sess.userId, email: sess.email, name: sess.name } }, cors, 200);
}

/* -------------------- router -------------------- */

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const cors = makeCORS(env, req.headers.get("Origin") || "");

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    try {
      if (url.pathname === "/health" && req.method === "GET") {
        return json({ ok: true }, cors);
      }

      // User Auth
      if (url.pathname === "/api/auth/register" && req.method === "POST") {
        return await handleRegister(req, env, cors);
      }
      if (url.pathname === "/api/auth/login" && req.method === "POST") {
        return await handleLogin(req, env, cors);
      }
      if (url.pathname === "/api/auth/logout" && req.method === "POST") {
        return await handleUserLogout(req, env, cors);
      }
      if (url.pathname === "/api/auth/me" && req.method === "GET") {
        return await handleGetUser(req, env, cors);
      }

      // OAuth (unified for both platforms)
      if ((url.pathname === "/api/oauth/exchange" || url.pathname === "/api/exchange") && req.method === "POST") {
        return await handleExchange(req, env, cors);
      }
      if ((url.pathname === "/api/oauth/logout" || url.pathname === "/api/logout") && req.method === "POST") {
        return await handleLogout(req, env, cors);
      }
      if (url.pathname === "/api/me" && req.method === "GET") {
        return await handleMe(req, env, cors);
      }

      // TikTok OAuth (legacy)
      if (url.pathname === "/api/tiktok/exchange" && req.method === "POST") {
        return await handleExchange(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/me" && req.method === "GET") {
        return await handleMe(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/upload-init" && req.method === "POST") {
        return await handleUploadInit(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/upload-chunk" && req.method === "POST") {
        return await handleUploadChunk(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/upload-complete" && req.method === "POST") {
        return await handleUploadComplete(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/upload" && req.method === "POST") {
        return await handleUpload(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/creator-info" && req.method === "GET") {
        return await handleCreatorInfo(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/status" && req.method === "GET") {
        return await handlePublishStatus(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/publish" && req.method === "POST") {
        return json({ status: "ok" }, cors);
      }

      // YouTube upload
      if (url.pathname === "/api/youtube/upload" && req.method === "POST") {
        return await handleYoutubeUpload(req, env, cors);
      }

      // Debug
      if (url.pathname === "/api/tiktok/tokens" && req.method === "GET") {
        const store = env.TOKENS || env.SESSIONS;
        const raw = store ? await store.get("tiktok:default") : null;
        return new Response(raw || "{}", {
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }

      // Projects
      if (url.pathname === "/api/projects" && req.method === "GET") {
        return await handleGetProjects(req, env, cors);
      }
      if (url.pathname === "/api/projects" && req.method === "POST") {
        return await handleCreateProject(req, env, cors);
      }

      // Videos
      if (url.pathname === "/api/videos" && req.method === "GET") {
        return await handleGetVideos(req, env, cors);
      }
      if (url.pathname === "/api/videos" && req.method === "POST") {
        return await handleSaveVideo(req, env, cors);
      }

      // Stats
      if (url.pathname === "/api/stats" && req.method === "GET") {
        return await handleGetStats(req, env, cors);
      }

      return new Response("Not found", { status: 404, headers: cors });
    } catch (e) {
      console.error("Worker error:", e);
      return json({ error: String(e?.message || e), stack: e?.stack }, cors, 500);
    }
  },
};
