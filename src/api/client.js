// Minimal fetch wrapper: base URL, bearer token, JSON, typed errors.

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

let token = null;
try {
  token = localStorage.getItem("tb_token");
} catch {
  /* private mode */
}

export function setToken(t) {
  token = t || null;
  try {
    if (t) localStorage.setItem("tb_token", t);
    else localStorage.removeItem("tb_token");
  } catch {
    /* ignore */
  }
}

export function getToken() {
  return token;
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code || "Xatolik");
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network", "Serverga ulanib bo'lmadi");
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error || data?.code,
      data?.message || res.statusText,
      data?.details
    );
  }
  return data;
}

export const api = {
  get: (p) => req("GET", p),
  post: (p, b) => req("POST", p, b ?? {}),
  patch: (p, b) => req("PATCH", p, b ?? {}),
  del: (p) => req("DELETE", p),
};
