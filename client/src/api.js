const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  window.location.origin
).replace(/\/+$/, "");

function getAuthToken() {
  try {
    return (
      localStorage.getItem("postpulse_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      ""
    );
  } catch {
    return "";
  }
}

function setAuthToken(token) {
  try {
    if (!token) return;
    localStorage.setItem("postpulse_token", token);
  } catch {
    // ignore storage errors
  }
}

function clearAuthToken() {
  try {
    localStorage.removeItem("postpulse_token");
  } catch {
    // ignore storage errors
  }
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, payload, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body:
      options.method === "GET" ? undefined : JSON.stringify(payload || {})
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* ---------- AUTH ---------- */

export async function registerUser(payload) {
  const data = await request("/api/auth/register", {
    email: payload?.email || "",
    password: payload?.password || ""
  });

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

export async function loginUser(payload) {
  const data = await request("/api/auth/login", {
    email: payload?.email || "",
    password: payload?.password || ""
  });

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

export function logoutUser() {
  clearAuthToken();
}

/* ---------- AI ---------- */

export async function generatePost(payload) {
  return request("/generate-post", {
    topic: payload?.topic || "",
    targetAudience: payload?.targetAudience || "",
    goal: payload?.goal || "",
    style: payload?.style || "professional",
    platform: payload?.platform || "instagram",
    language: payload?.language || "en"
  });
}

export async function improvePost(payload) {
  return request("/improve-post", {
    post: payload?.post || "",
    goal: payload?.goal || "",
    style: payload?.style || "professional",
    platform: payload?.platform || "instagram",
    language: payload?.language || "en"
  });
}

export async function analyzePost(payload) {
  return request("/analyze-post", {
    post: payload?.post || "",
    platform: payload?.platform || "instagram",
    language: payload?.language || "en"
  });
}
