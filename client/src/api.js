const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

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

export function getStoredToken() {
  return "";
}

export function hasToken() {
  return false;
}

export function getStoredUser() {
  return null;
}

export function logoutUser() {
  return null;
}

export async function registerUser() {
  throw new Error("Auth is not active in the restored server version");
}

export async function loginUser() {
  throw new Error("Auth is not active in the restored server version");
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

export async function analyzePost(payload) {
  return request("/analyze-post", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export async function savePost() {
  return {
    success: false
  };
}

export async function getMyPosts() {
  return {
    success: true,
    posts: []
  };
}

export async function deletePost() {
  return {
    success: false
  };
}
