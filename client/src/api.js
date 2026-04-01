const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
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

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || "Something went wrong"
    );
  }

  return data;
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
