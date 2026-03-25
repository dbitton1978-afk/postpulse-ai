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

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function tryPost(path, payload) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload || {})
  });

  const data = await parseJsonSafe(response);

  return {
    ok: response.ok,
    status: response.status,
    data,
    message:
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
  };
}

async function requestWithFallback(paths, payload) {
  let lastError = "Request failed";

  for (const path of paths) {
    const result = await tryPost(path, payload);

    if (result.ok) {
      return result.data;
    }

    lastError = result.message;

    const isRouteError =
      result.status === 404 ||
      String(result.message || "").toLowerCase().includes("route not found");

    if (!isRouteError) {
      throw new Error(result.message);
    }
  }

  throw new Error(lastError);
}

export async function generatePost(payload) {
  const body = {
    ...payload,
    ideaPrompt: payload?.topic || payload?.ideaPrompt || "",
    post: payload?.topic || payload?.post || "",
    topic: payload?.topic || "",
    length: payload?.length || "medium"
  };

  return requestWithFallback(
    [
      "/api/generate-post",
      "/api/posts/generate"
    ],
    body
  );
}

export async function improvePost(payload) {
  const body = {
    ...payload,
    originalPost: payload?.post || payload?.originalPost || "",
    post: payload?.post || "",
    length: payload?.length || "medium"
  };

  return requestWithFallback(
    [
      "/api/improve-post",
      "/api/posts/optimize"
    ],
    body
  );
}

export async function analyzePost(payload) {
  const body = {
    ...payload,
    originalPost: payload?.post || payload?.originalPost || "",
    post: payload?.post || ""
  };

  return requestWithFallback(
    [
      "/api/analyze-post",
      "/api/posts/analyze"
    ],
    body
  );
}
