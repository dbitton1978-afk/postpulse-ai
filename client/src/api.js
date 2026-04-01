const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const TOKEN_KEY = "postpulse_token";
const USER_KEY = "postpulse_user";

function buildUrl(path) {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}

function parseJsonSafely(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: getAuthHeaders(options.headers || {})
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof data === "object" && data?.message) ||
      (typeof data === "object" && data?.error) ||
      (typeof data === "string" && data) ||
      "Request failed";

    throw new Error(message);
  }

  return data;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function hasToken() {
  return Boolean(getStoredToken());
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);
  return parseJsonSafely(rawUser, null);
}

export function setStoredAuth(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function logoutUser() {
  clearStoredAuth();
}

export async function registerUser(payload) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });

  if (data?.token) {
    setStoredAuth(data.token, data.user || null);
  }

  return data;
}

export async function loginUser(payload) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });

  if (data?.token) {
    setStoredAuth(data.token, data.user || null);
  }

  return data;
}

export async function generatePost(payload) {
  return request("/api/posts/generate", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export async function improvePost(payload) {
  return request("/api/posts/improve", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export async function analyzePost(payload) {
  return request("/api/posts/analyze", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export async function savePost(payload) {
  return request("/api/posts/save", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export async function getMyPosts() {
  return request("/api/posts/my-posts", {
    method: "GET"
  });
}

export async function deleteHistoryItem(postId) {
  return request(`/api/posts/${postId}`, {
    method: "DELETE"
  });
}

export async function checkHealth() {
  return request("/api/health", {
    method: "GET"
  });
}
