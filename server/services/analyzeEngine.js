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

function normalizeScore(value, fallback = 60) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
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

export async function analyzeEngine(input) {
  const {
    post = "",
    platform = "instagram",
    language = "en"
  } = input || {};

  const safeLanguage = normalizeLanguage(language);

  const prompt = `
You are a brutally honest content strategist.

Write ONLY in ${getLanguageLabel(safeLanguage)}.

Analyze this post for platform ${platform}.

POST:
${post}

Return ONLY valid JSON:
{
  "viralScore": 0,
  "authenticityScore": 0,
  "clarityScore": 0,
  "emotionalScore": 0,
  "curiosityScore": 0,
  "hookScore": 0,
  "ctaScore": 0,
  "summary": "",
  "whatWorks": [],
  "whatHurts": [],
  "improvements": [],
  "raiseViralScore": [],
  "raiseAuthenticityScore": [],
  "raiseEmotionalScore": [],
  "raiseCuriosityScore": [],
  "improvedVersion": ""
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.55
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(raw, {});

  return {
    viralScore: normalizeScore(parsed.viralScore, 55),
    authenticityScore: normalizeScore(parsed.authenticityScore, 60),
    clarityScore: normalizeScore(parsed.clarityScore, 64),
    emotionalScore: normalizeScore(parsed.emotionalScore, 52),
    curiosityScore: normalizeScore(parsed.curiosityScore, 50),
    hookScore: normalizeScore(parsed.hookScore, 46),
    ctaScore: normalizeScore(parsed.ctaScore, 45),
    summary: normalizeString(parsed.summary),
    whatWorks: normalizeArray(parsed.whatWorks, 6),
    whatHurts: normalizeArray(parsed.whatHurts, 6),
    improvements: normalizeArray(parsed.improvements, 6),
    raiseViralScore: normalizeArray(parsed.raiseViralScore, 5),
    raiseAuthenticityScore: normalizeArray(parsed.raiseAuthenticityScore, 5),
    raiseEmotionalScore: normalizeArray(parsed.raiseEmotionalScore, 5),
    raiseCuriosityScore: normalizeArray(parsed.raiseCuriosityScore, 5),
    improvedVersion: normalizeString(parsed.improvedVersion, post)
  };
}
