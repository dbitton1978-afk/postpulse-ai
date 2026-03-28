import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeArray(value, limit = 8) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeLanguage(language) {
  return language === "he" ? "he" : "en";
}

function getLanguageLabel(language) {
  return normalizeLanguage(language) === "he" ? "Hebrew" : "English";
}

export async function generateEngine(input) {
  const {
    topic = "",
    targetAudience = "",
    goal = "",
    style = "professional",
    platform = "instagram",
    language = "en"
  } = input || {};

  const safeLanguage = normalizeLanguage(language);

  const prompt = `
You are an elite social media strategist and writer.

Write ONLY in ${getLanguageLabel(safeLanguage)}.

Create a strong social media post.

INPUT:
Topic: ${topic}
Target Audience: ${targetAudience}
Goal: ${goal}
Style: ${style}
Platform: ${platform}

Return ONLY valid JSON:
{
  "title": "",
  "hook": "",
  "body": "",
  "cta": "",
  "hashtags": [],
  "shortVersion": "",
  "alternativeVersion": ""
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(raw, {});

  return {
    title: normalizeString(parsed.title, topic ? `Post about ${topic}` : ""),
    hook: normalizeString(parsed.hook),
    body: normalizeString(parsed.body),
    cta: normalizeString(parsed.cta),
    hashtags: normalizeArray(parsed.hashtags, 8),
    shortVersion: normalizeString(parsed.shortVersion),
    alternativeVersion: normalizeString(parsed.alternativeVersion)
  };
}
