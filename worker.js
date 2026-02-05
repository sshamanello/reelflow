// src/worker.js

/* -------------------- utils -------------------- */

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

async function tiktokTokenByCode(env, { code, redirect_uri }) {
  const form = new URLSearchParams();
  form.set("client_key", env.TIKTOK_CLIENT_KEY);
  form.set("client_secret", env.TIKTOK_CLIENT_SECRET);
  form.set("grant_type", "authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirect_uri);

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

    const { code, redirect_uri, platform } = body;
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
      const token = await tiktokTokenByCode(env, { code, redirect_uri });
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

/* -------------------- creator_info -------------------- */

async function handleCreatorInfo(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const access_token = sess.tiktok?.access_token;
  if (!access_token) {
    return json({ error: "no_tiktok_token", message: "Please connect TikTok account first" }, cors, 401);
  }

  try {
    // Get creator info from TikTok
    const profile = await tiktokMe(access_token);

    if (profile.__error) {
      return json({ error: "tiktok_api_error", detail: profile }, cors, 500);
    }

    // Return creator info with privacy options
    return json({
      avatar_url: profile.avatar_url,
      nickname: profile.display_name,
      handle: profile.handle,
      can_post: true, // Assuming if they have token, they can post
      privacy_level_options: [
        { value: "PUBLIC_TO_EVERYONE", label: "Public" },
        { value: "MUTUAL_FOLLOW_FRIEND", label: "Friends" },
        { value: "SELF_ONLY", label: "Only Me" }
      ],
      interaction_settings: {
        allow_comment: true,
        allow_duet: true,
        allow_stitch: true
      }
    }, cors, 200);
  } catch (e) {
    console.error("Creator info error:", e);
    return json({ error: "server_error", message: e?.message || String(e) }, cors, 500);
  }
}

/* -------------------- publish -------------------- */

async function handlePublish(req, env, cors) {
  const sid = getSidFromReq(req, env);
  const sess = await getSession(env, sid);
  if (!sess) return json({ error: "unauthorized" }, cors, 401);

  const access_token = sess.tiktok?.access_token;
  if (!access_token) {
    return json({ error: "no_tiktok_token", message: "Please connect TikTok account first" }, cors, 401);
  }

  try {
    const body = await req.json();
    const {
      video_ref,
      title = "",
      hashtags = [],
      privacy_level,
      comment_disabled = false,
      duet_disabled = false,
      stitch_disabled = false,
      is_branded_content = false,
      brand_content_type = []
    } = body;

    if (!video_ref) {
      return json({ error: "missing_video_ref" }, cors, 400);
    }

    if (!privacy_level) {
      return json({ error: "missing_privacy_level" }, cors, 400);
    }

    // Validate branded content + SELF_ONLY combination
    if (is_branded_content && brand_content_type.includes('BRANDED_CONTENT') && privacy_level === 'SELF_ONLY') {
      return json({ error: "invalid_privacy_branded_content", message: "Cannot use 'Only Me' privacy with branded content" }, cors, 400);
    }

    // Call TikTok publish API
    const publishBody = {
      video_ref: video_ref,
      title: title,
      hashtags: hashtags,
      privacy_level: privacy_level,
      comment_disabled: comment_disabled,
      duet_disabled: duet_disabled,
      stitch_disabled: stitch_disabled,
      brand_authorized: is_branded_content,
      brand_content_type: brand_content_type
    };

    console.log("Publishing to TikTok:", JSON.stringify(publishBody, null, 2));

    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/publish/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "Accept": "application/json",
      },
      body: JSON.stringify(publishBody),
    });

    const responseText = await response.text();
    console.log("TikTok publish response status:", response.status, "body:", responseText);

    if (!response.ok) {
      return json({ error: "publish_failed", status: response.status, detail: responseText }, cors, 500);
    }

    const responseData = JSON.parse(responseText);
    const videoId = responseData?.data?.video_id;

    return json({
      success: true,
      video_id: videoId,
      video_url: responseData?.data?.video_url || null,
      publish_id: video_ref
    }, cors, 200);

  } catch (e) {
    console.error("Publish error:", e);
    return json({ error: "server_error", message: e?.message || String(e) }, cors, 500);
  }
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

    // Удаляем токен платформы из сессии
    if (platform === 'tiktok') {
      delete sess.tiktok;
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

/* -------------------- upload stub -------------------- */

// POST /api/tiktok/upload — загрузка видео в Inbox (fixed 5MB chunks)
// POST /api/tiktok/upload — Inbox Upload c правильным total_chunk_count (floor) и «расширенным» последним чанком
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

  // 2) базовый размер чанка
  const FIVE_MB = 5 * 1024 * 1024; // 5,242,880
  const baseChunk = (size < FIVE_MB) ? size : FIVE_MB;

  // ВАЖНО: total_chunk_count = floor(size / baseChunk)
  // Последний чанк = baseChunk + remainder (может быть > baseChunk, до 128MB)
  const totalChunks = Math.max(1, Math.floor(size / baseChunk));
  const remainder = size - (baseChunk * totalChunks); // 0..(baseChunk-1)

  // 3) INIT — шлём baseChunk и floor-count (как требуют доки)
  const initBody = {
    source_info: {
      source: "FILE_UPLOAD",
      video_size: size,
      chunk_size: baseChunk,
      total_chunk_count: totalChunks,
    },
  };

  const initResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(initBody),
  });

  const initText = await initResp.text();
  console.log("Inbox INIT status:", initResp.status, "body:", initText);

  let initJson = {};
  try { initJson = JSON.parse(initText); } catch {}
  const initOk = initResp.ok && (!initJson.error || initJson.error.code === "ok");
  if (!initOk) {
    return json({ error: "init_failed", status: initResp.status, detail: initJson || initText }, cors, 400);
  }

  const uploadUrl = initJson?.data?.upload_url;
  const publishId = initJson?.data?.publish_id;
  if (!uploadUrl || !publishId) {
    return json({ error: "init_missing_fields", detail: initJson }, cors, 400);
  }

  // 4) PUT чанки
  let offset = 0;
  for (let i = 0; i < totalChunks; i++) {
    // для первых (totalChunks - 1) чанк-ов шлём ровно baseChunk
    // для последнего — baseChunk + remainder
    const isLast = (i === totalChunks - 1);
    const thisLen = isLast ? (baseChunk + remainder) : baseChunk;

    const start = offset;
    const end = start + thisLen - 1; // включительно
    const chunk = buf.slice(start, end + 1);

    const putResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${start}-${end}/${size}`, // 0-based inclusive
        Accept: "application/json",
      },
      body: chunk,
    });

    if (!(putResp.ok || putResp.status === 206 || putResp.status === 201)) {
      const putText = await putResp.text().catch(() => "");
      console.log("Chunk PUT failed:", putResp.status, putText);
      return json(
        {
          error: "chunk_upload_failed",
          status: putResp.status,
          range: `bytes ${start}-${end}/${size}`,
          body: putText,
          publish_id: publishId,
        },
        cors,
        502
      );
    }

    offset = end + 1;
  }

  // 5) PUBLISH — перемещаем видео из Inbox в черновики
  const publishBody = {
    publish_id: publishId,
  };

  console.log("Publishing video to TikTok drafts...");
  const publishResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/publish/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(publishBody),
  });

  const publishText = await publishResp.text();
  console.log("Inbox PUBLISH status:", publishResp.status, "body:", publishText);

  let publishJson = {};
  try { publishJson = JSON.parse(publishText); } catch {}

  if (!publishResp.ok) {
    // Если publish не работает (API не одобрен), возвращаем upload с сообщением
    console.log("Publish failed, returning uploaded_to_inbox");
    return json({
      status: "uploaded_to_inbox",
      publish_id: publishId,
      message: "Video uploaded to TikTok inbox. Note: Content Publishing API may require approval before videos appear in drafts.",
      publish_error: {
        status: publishResp.status,
        detail: publishJson || publishText
      }
    }, cors, 200);
  }

  // 6) Готово — видео в черновиках TikTok
  const videoId = publishJson?.data?.video_id || publishId;
  return json({
    status: "published",
    publish_id: publishId,
    video_id: videoId,
    video_url: publishJson?.data?.video_url,
  }, cors, 200);
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
  if (!sid) return json({ error: "unauthorized" }, cors, 401);

  const projectsKey = `projects:${sid}`;
  const raw = await env.SESSIONS.get(projectsKey);
  const projects = raw ? JSON.parse(raw) : [];

  return json({ projects }, cors, 200);
}

async function handleCreateProject(req, env, cors) {
  const sid = getSidFromReq(req, env);
  if (!sid) return json({ error: "unauthorized" }, cors, 401);

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
  if (!sid) return json({ error: "unauthorized" }, cors, 401);

  const videosKey = `videos:${sid}`;
  const raw = await env.SESSIONS.get(videosKey);
  const videos = raw ? JSON.parse(raw) : [];

  return json({ videos }, cors, 200);
}

async function handleSaveVideo(req, env, cors) {
  const sid = getSidFromReq(req, env);
  if (!sid) return json({ error: "unauthorized" }, cors, 401);

  const body = await req.json();
  const { projectId, videoName, publishId, status } = body;

  const videosKey = `videos:${sid}`;
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

async function handleDeleteVideo(req, env, cors) {
  const sid = getSidFromReq(req, env);
  if (!sid) return json({ error: "unauthorized" }, cors, 401);

  const url = new URL(req.url);
  const videoId = parseInt(url.pathname.split('/').pop());

  const videosKey = `videos:${sid}`;
  const raw = await env.SESSIONS.get(videosKey);
  const videos = raw ? JSON.parse(raw) : [];

  const updatedVideos = videos.filter(v => v.id !== videoId);

  await env.SESSIONS.put(videosKey, JSON.stringify(updatedVideos), {
    expirationTtl: 60 * 60 * 24 * 30,
  });

  return json({ success: true }, cors, 200);
}

async function handleGetStats(req, env, cors) {
  const sid = getSidFromReq(req, env);
  if (!sid) return json({ error: "unauthorized" }, cors, 401);

  const videosKey = `videos:${sid}`;
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

      // OAuth (unified for both platforms)
      if (url.pathname === "/api/oauth/exchange" && req.method === "POST") {
        return await handleExchange(req, env, cors);
      }
      if (url.pathname === "/api/oauth/logout" && req.method === "POST") {
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
      if (url.pathname === "/api/tiktok/upload" && req.method === "POST") {
        return await handleUpload(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/creator_info" && req.method === "GET") {
        return await handleCreatorInfo(req, env, cors);
      }
      if (url.pathname === "/api/tiktok/publish" && req.method === "POST") {
        return await handlePublish(req, env, cors);
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
      if (url.pathname.startsWith("/api/videos/") && req.method === "DELETE") {
        return await handleDeleteVideo(req, env, cors);
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
