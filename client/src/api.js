const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TOKEN_KEY = "postpulse_token";
const USER_KEY = "postpulse_user";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Something went wrong");
  }

  return data;
}

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function saveAuth(data) {
  if (data?.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }

  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function registerUser(payload) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });

  return saveAuth(data);
}

export async function loginUser(payload) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });

  return saveAuth(data);
}

export async function generatePost(payload) {
  return request("/generate-post", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export async function improvePost(payload) {
  return request("/improve-post", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export async function savePost(payload) {
  return request("/api/posts/save", {
    method: "POST",
    headers: {
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload || {})
  });
}

export async function getMyPosts() {
  return request("/api/posts/my-posts", {
    method: "GET",
    headers: {
      ...getAuthHeaders()
    }
  });
}

export async function deletePost(postId) {
  return request(`/api/posts/${postId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders()
    }
  });
}
