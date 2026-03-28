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

function normalizeArray(value, limit = 6) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
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

export async function improveEngine(input) {
  const {
    post = "",
    goal = "",
    style = "professional",
    platform = "instagram",
    language = "en"
  } = input || {};

  const safeLanguage = normalizeLanguage(language);

  const prompt = `
You are an elite content editor.

Write ONLY in ${getLanguageLabel(safeLanguage)}.

Improve this post.

POST:
${post}

GOAL:
${goal}

STYLE:
${style}

PLATFORM:
${platform}

Return ONLY valid JSON:
{
  "strengths": [],
  "weaknesses": [],
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "tips": []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.75
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(raw, {});

  return {
    strengths: normalizeArray(parsed.strengths, 6),
    weaknesses: normalizeArray(parsed.weaknesses, 6),
    improvedPost: normalizeString(parsed.improvedPost, post),
    moreViralVersion: normalizeString(parsed.moreViralVersion, post),
    moreAuthenticVersion: normalizeString(parsed.moreAuthenticVersion, post),
    tips: normalizeArray(parsed.tips, 6)
  };
}
