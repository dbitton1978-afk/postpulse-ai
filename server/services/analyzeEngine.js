import OpenAI from "openai";
import { safeJsonParse } from "../utils/safeParse.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

function getLanguageInstruction(language) {
  return normalizeLanguage(language) === "he"
    ? "Write EVERYTHING in natural Hebrew only. All analysis fields, bullets, summary, and improvedVersion must be in Hebrew."
    : "Write EVERYTHING in natural English only. All analysis fields, bullets, summary, and improvedVersion must be in English.";
}

function getPlatformInstruction(platform) {
  const p = String(platform || "").toLowerCase();

  if (p === "instagram") {
    return "Instagram content should be emotionally immediate, fast to scan, hook-first, and engagement-oriented.";
  }

  if (p === "facebook") {
    return "Facebook content should feel conversational, relatable, human, and easy to respond to.";
  }

  if (p === "linkedin") {
    return "LinkedIn content should feel sharper, more credible, insight-led, and professionally clear.";
  }

  if (p === "tiktok") {
    return "TikTok content should be punchy, fast, curiosity-driven, and rhythmically tight.";
  }

  return "Judge the content by the platform it is intended for.";
}

function normalizeAnalyzeResult(data, originalPost, language) {
  const isHebrew = normalizeLanguage(language) === "he";

  const summaryFallback = isHebrew
    ? "הפוסט צריך חידוד בפתיחה, יותר אנושיות, וקריאה לפעולה חזקה יותר."
    : "The post needs a sharper opening, more humanity, and a stronger call to action.";

  return {
    viralScore: normalizeScore(data?.viralScore, 55),
    authenticityScore: normalizeScore(data?.authenticityScore, 60),
    clarityScore: normalizeScore(data?.clarityScore, 64),
    emotionalScore: normalizeScore(data?.emotionalScore, 52),
    curiosityScore: normalizeScore(data?.curiosityScore, 50),
    hookScore: normalizeScore(data?.hookScore, 46),
    ctaScore: normalizeScore(data?.ctaScore, 45),
    summary: normalizeString(data?.summary, summaryFallback),
    whatWorks: normalizeArray(data?.whatWorks, 6),
    whatHurts: normalizeArray(data?.whatHurts, 6),
    improvements: normalizeArray(data?.improvements, 6),
    raiseViralScore: normalizeArray(data?.raiseViralScore, 5),
    raiseAuthenticityScore: normalizeArray(data?.raiseAuthenticityScore, 5),
    raiseEmotionalScore: normalizeArray(data?.raiseEmotionalScore, 5),
    raiseCuriosityScore: normalizeArray(data?.raiseCuriosityScore, 5),
    improvedVersion: normalizeString(data?.improvedVersion, originalPost)
  };
}

export async function analyzeEngine(input) {
  const { post, platform = "instagram", language = "en" } = input;
  const safeLanguage = normalizeLanguage(language);

  const prompt = `
You are a brutally honest senior social content strategist.

TASK:
Analyze the post like a real expert.
Do not be polite.
Do not inflate scores.
Do not reward average writing.

POST:
${post}

PLATFORM:
${platform}

PLATFORM STANDARD:
${getPlatformInstruction(platform)}

LANGUAGE:
${getLanguageLabel(safeLanguage)}

CRITICAL LANGUAGE RULE:
${getLanguageInstruction(safeLanguage)}

SCORING LOGIC:
- 50-65 = average
- 65-80 = good
- 80+ = excellent
- weak hook must reduce hookScore hard
- weak ending or weak ask must reduce ctaScore hard
- robotic or generic tone must reduce authenticityScore
- flat emotional energy must reduce emotionalScore
- predictable writing must reduce curiosityScore
- viralScore should reflect stopping power + shareability + energy

ANALYSIS RULES:
- be specific
- mention real weaknesses first
- avoid vague praise
- avoid generic advice
- focus on what would actually improve performance

OUTPUT RULES:
- whatWorks = concrete strengths only
- whatHurts = concrete weaknesses only
- improvements = practical rewrite directions
- raiseViralScore = specific actions to increase shareability
- raiseAuthenticityScore = specific actions to reduce AI feel
- raiseEmotionalScore = specific actions to deepen emotion
- raiseCuriosityScore = specific actions to increase intrigue
- improvedVersion = a clearly stronger rewritten version, not a tiny edit

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

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeAnalyzeResult(parsed, post, safeLanguage);
}
