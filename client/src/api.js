const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  window.location.origin
).replace(/\/+$/, "");

async function request(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload || {})
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function generatePost(payload) {
  return request("/api/generate-post", payload);
}

export async function improvePost(payload) {
  return request("/api/improve-post", payload);
}

export async function analyzePost(payload) {
  return request("/api/analyze-post", payload);
}
