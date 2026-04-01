const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TOKEN_KEYS = ["token", "postpulse_token", "authToken"];
const USER_KEYS = ["user", "postpulse_user", "authUser"];

function readFirstExisting(keys) {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

function writeAll(keys, value) {
  keys.forEach((key) => {
    localStorage.setItem(key, value);
  });
}

function removeAll(keys) {
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function getStoredToken() {
  return readFirstExisting(TOKEN_KEYS);
}

export function hasToken() {
  return Boolean(getStoredToken());
}

export function getStoredUser() {
  for (const key of USER_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
    }
  }

  return null;
}

export function logoutUser() {
  removeAll(TOKEN_KEYS);
  removeAll(USER_KEYS);
}

function getAuthHeaders() {
  const token = getStoredToken();

  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
}

function persistAuth(responseData) {
  if (responseData?.token) {
    writeAll(TOKEN_KEYS, responseData.token);
  }

  if (responseData?.user) {
    const userJson = JSON.stringify(responseData.user);
    writeAll(USER_KEYS, userJson);
  }

  return responseData;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    logoutUser();
    throw new Error(data?.message || "Session expired");
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Something went wrong");
  }

  return data;
}

export async function registerUser(payload) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });

  return persistAuth(data);
}

export async function loginUser(payload) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });

  return persistAuth(data);
}

export async function generatePost(payload) {
  return request("/api/posts/generate", {
    method: "POST",
    headers: {
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload || {})
  });
}

export async function improvePost(payload) {
  return request("/api/posts/improve", {
    method: "POST",
    headers: {
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload || {})
  });
}

export async function analyzePost(payload) {
  return request("/api/posts/analyze", {
    method: "POST",
    headers: {
      ...getAuthHeaders()
    },
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
