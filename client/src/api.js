const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const response = await fetch(url, config);

    let data = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Unable to connect to server");
    }

    throw error;
  }
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
