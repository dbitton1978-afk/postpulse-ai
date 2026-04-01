const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const TOKEN_KEY = "postpulse_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

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
