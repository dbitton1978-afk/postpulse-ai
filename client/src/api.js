const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

const TOKEN_KEY = "postpulse_token";
const USER_KEY = "postpulse_user";

function buildHeaders(token, extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.token, options.headers)
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { success: false, error: raw || "Invalid server response" };
  }

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export function clearAuth() {
  clearToken();
  clearStoredUser();
}

export async function registerUser(payload) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (data?.token) {
    setToken(data.token);
  }

  if (data?.user) {
    setStoredUser(data.user);
  }

  return data;
}

export async function loginUser(payload) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (data?.token) {
    setToken(data.token);
  }

  if (data?.user) {
    setStoredUser(data.user);
  }

  return data;
}

export function logoutUser() {
  clearAuth();
}

export async function generatePost(payload) {
  const token = getToken();

  return request("/api/posts/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    token
  });
}

export async function improvePost(payload) {
  const token = getToken();

  return request("/api/posts/improve", {
    method: "POST",
    body: JSON.stringify(payload),
    token
  });
}

export async function analyzePost(payload) {
  const token = getToken();

  return request("/api/posts/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
    token
  });
}

export async function savePost(payload) {
  const token = getToken();

  return request("/api/posts/save", {
    method: "POST",
    body: JSON.stringify(payload),
    token
  });
}

export async function loadMyPosts() {
  const token = getToken();

  return request("/api/posts/my-posts", {
    method: "GET",
    token
  });
}

export async function healthCheck() {
  return request("/api/health", {
    method: "GET"
  });
}
