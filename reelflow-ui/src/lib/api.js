const API_BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  const text = await res.text();

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data?.error || "request_failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

export const api = {
  getMe() {
    return request("/api/me", { method: "GET" });
  },

  exchangeCode(payload) {
    return request("/api/exchange", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  disconnectPlatform(platform) {
    return request("/api/logout", {
      method: "POST",
      body: JSON.stringify({ platform }),
    });
  },

  getProjects() {
    return request("/api/projects", { method: "GET" });
  },

  createProject(payload) {
    return request("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getVideos() {
    return request("/api/videos", { method: "GET" });
  },

  saveVideo(payload) {
    return request("/api/videos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getStats() {
    return request("/api/stats", { method: "GET" });
  },

  async uploadTikTok({ file }) {
    const form = new FormData();
    form.append("file", file);
    return request("/api/tiktok/upload", {
      method: "POST",
      body: form,
    });
  },

  async uploadYouTube({ file, title, description, privacy = "public", tags = "" }) {
    const form = new FormData();
    form.append("file", file);
    form.append("title", title || "");
    form.append("description", description || "");
    form.append("privacy", privacy);
    form.append("tags", tags || "");

    return request("/api/youtube/upload", {
      method: "POST",
      body: form,
    });
  },
};
