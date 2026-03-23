const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function generatePost(payload) {
  return request("/api/generate-post", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function improvePost(payload) {
  return request("/api/improve-post", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function analyzePost(payload) {
  return request("/api/analyze-post", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function analyzeImage(payload) {
  return request("/api/analyze-image", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function generatePostFromImageAnalysis(payload) {
  return request("/api/generate-post-from-image-analysis", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function analyzePost(payload) {
  return request("/api/analyze-post", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
