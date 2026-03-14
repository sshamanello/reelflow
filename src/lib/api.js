const API_BASE = import.meta.env.VITE_API_BASE || "";
// Set VITE_MOCK_API=true in .env.local to use mock mode for UI development
const MOCK_API = (import.meta.env.VITE_MOCK_API || "false") === "true";

const mockDb = {
  profiles: {},
  projects: [],
  videos: [],
  stats: { uploaded: 0, scheduled: 0, published: 0, errors: 0 },
};

function sleep(ms = 120) {
  return new Promise((r) => setTimeout(r, ms));
}

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

async function mockRequest(method, path, payload) {
  await sleep();

  if (method === "GET" && path === "/api/me") return { profiles: mockDb.profiles };
  if (method === "GET" && path === "/api/stats") return mockDb.stats;
  if (method === "GET" && path === "/api/projects") return { projects: mockDb.projects };
  if (method === "GET" && path === "/api/videos") return { videos: mockDb.videos };

  if (method === "POST" && path === "/api/projects") {
    const project = {
      id: Date.now(),
      name: payload?.name || "Untitled",
      platforms: payload?.platforms || [],
      videos: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    mockDb.projects.push(project);
    return { project };
  }

  if (method === "POST" && path === "/api/videos") {
    const video = {
      id: Date.now(),
      projectId: payload?.projectId,
      name: payload?.videoName || "Untitled",
      publishId: payload?.publishId || `mock_${Date.now()}`,
      status: payload?.status || "uploaded",
      createdAt: new Date().toISOString(),
    };
    mockDb.videos.push(video);

    if (video.status === "published") mockDb.stats.published += 1;
    else if (video.status === "scheduled") mockDb.stats.scheduled += 1;
    else if (video.status === "failed") mockDb.stats.errors += 1;
    else mockDb.stats.uploaded += 1;

    return { video };
  }

  if (method === "POST" && (path === "/api/logout" || path === "/api/oauth/logout")) {
    const platform = payload?.platform;
    if (platform) delete mockDb.profiles[platform];
    return { success: true };
  }

  if (method === "POST" && (path === "/api/exchange" || path === "/api/oauth/exchange")) {
    const platform = payload?.platform;
    if (platform === "tiktok") {
      mockDb.profiles.tiktok = {
        platform: "tiktok",
        display_name: "Mock TikTok User",
        handle: "@mock_tiktok",
      };
    }
    return { ok: true, profile: mockDb.profiles[platform], sid: "mock_sid" };
  }

  if (method === "POST" && path === "/api/tiktok/upload") {
    mockDb.stats.uploaded += 1;
    return { status: "uploaded_to_inbox", publish_id: `tt_${Date.now()}` };
  }

  return { ok: true, mock: true };
}

export const api = {
  getMe() {
    return MOCK_API ? mockRequest("GET", "/api/me") : request("/api/me", { method: "GET" });
  },

  exchangeCode(payload) {
    return MOCK_API
      ? mockRequest("POST", "/api/oauth/exchange", payload)
      : request("/api/oauth/exchange", {
          method: "POST",
          body: JSON.stringify(payload),
        });
  },

  disconnectPlatform(platform) {
    return MOCK_API
      ? mockRequest("POST", "/api/oauth/logout", { platform })
      : request("/api/oauth/logout", {
          method: "POST",
          body: JSON.stringify({ platform }),
        });
  },

  getProjects() {
    return MOCK_API ? mockRequest("GET", "/api/projects") : request("/api/projects", { method: "GET" });
  },

  createProject(payload) {
    return MOCK_API
      ? mockRequest("POST", "/api/projects", payload)
      : request("/api/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
  },

  getVideos() {
    return MOCK_API ? mockRequest("GET", "/api/videos") : request("/api/videos", { method: "GET" });
  },

  saveVideo(payload) {
    return MOCK_API
      ? mockRequest("POST", "/api/videos", payload)
      : request("/api/videos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
  },

  getStats() {
    return MOCK_API ? mockRequest("GET", "/api/stats") : request("/api/stats", { method: "GET" });
  },

  async uploadTikTok({ file }) {
    if (MOCK_API) return mockRequest("POST", "/api/tiktok/upload", { fileName: file?.name });
    const form = new FormData();
    form.append("file", file);
    return request("/api/tiktok/upload", {
      method: "POST",
      body: form,
    });
  },
};
