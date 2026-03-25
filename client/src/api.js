const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  window.location.origin
).replace(/\/+$/, "");

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload || {})
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
