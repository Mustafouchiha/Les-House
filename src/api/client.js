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
  if (!BASE && import.meta.env.PROD) {
    throw new ApiError(
      0,
      "config",
      "VITE_API_URL sozlanmagan — frontend backendga ulana olmaydi"
    );
  }
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
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        res.status,
        "bad_response",
        `Server JSON emas qaytardi (HTTP ${res.status}). API URL noto'g'ri bo'lishi mumkin.`
      );
    }
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error || data?.code,
      data?.message || res.statusText || `HTTP ${res.status}`,
      data?.details
    );
  }
  return data;
}

async function reqBlob(path) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { headers });
  } catch {
    throw new ApiError(0, "network", "Serverga ulanib bo'lmadi");
  }
  if (!res.ok) throw new ApiError(res.status, "download", "Yuklab bo'lmadi");
  return res.blob();
}

export const api = {
  get: (p) => req("GET", p),
  post: (p, b) => req("POST", p, b ?? {}),
  patch: (p, b) => req("PATCH", p, b ?? {}),
  del: (p, b) => req("DELETE", p, b ?? {}),
  blob: (p) => reqBlob(p),
};
