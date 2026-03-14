// Auth API calls

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function authRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

export async function apiRegister({ email, password, name }) {
  return authRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function apiLogin({ email, password }) {
  return authRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogout() {
  return authRequest("/api/auth/logout", { method: "POST" });
}

export async function apiGetUser() {
  return authRequest("/api/auth/me", { method: "GET" });
}
