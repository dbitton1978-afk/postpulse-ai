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

function normalizeArray(value, limit = 5) {
  if (!Array.isArray(value)) return [];
  return value.map((i) => String(i || "").trim()).filter(Boolean).slice(0, limit);
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
    ? "Write EVERYTHING in natural Hebrew only. Do not use English at all unless the user explicitly provided an English brand name or platform name. All fields in the JSON must be in Hebrew."
    : "Write EVERYTHING in natural English only. All fields in the JSON must be in English.";
}

function normalizeAnalyzeResult(data, originalPost) {
  return {
    viralScore: normalizeScore(data?.viralScore, 55),
    authenticityScore: normalizeScore(data?.authenticityScore, 60),
    clarityScore: normalizeScore(data?.clarityScore, 65),
    emotionalScore: normalizeScore(data?.emotionalScore, 50),
    curiosityScore: normalizeScore(data?.curiosityScore, 50),
    hookScore: normalizeScore(data?.hookScore, 45),
    ctaScore: normalizeScore(data?.ctaScore, 45),
    summary: normalizeString(data?.summary),
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
  const { post, platform, language = "en" } = input;
  const safeLanguage = normalizeLanguage(language);

  const prompt = `
You are a brutally honest senior content strategist.

Your job:
- DO NOT be polite
- DO NOT inflate scores
- Identify real weaknesses
- Think like a viral content expert

POST:
${post}

PLATFORM:
${platform}

LANGUAGE:
${getLanguageLabel(safeLanguage)}

CRITICAL LANGUAGE RULE:
${getLanguageInstruction(safeLanguage)}

SCORING RULES:
- Average content = 50-65
- Good content = 65-80
- Excellent content = 80+
- Weak hook = low hookScore (below 50)
- Weak CTA = low ctaScore
- AI tone = lower authenticityScore
- Boring = low curiosityScore
- No emotional pull = low emotionalScore

ANALYSIS RULES:
- Be direct and specific
- Point to EXACT weaknesses
- Avoid generic phrases
- Do not say "this is good" without reason

IMPROVEMENT RULES:
- Improvements must be actionable
- Not theory — actual changes

IMPROVED VERSION:
- Must be significantly better
- More human
- Stronger hook
- Better flow
- Better ending

Return ONLY JSON:
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
    temperature: 0.6
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeAnalyzeResult(parsed, post);
}
