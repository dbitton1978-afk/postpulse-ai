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
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeAnalyzeResult(data, originalPost) {
  return {
    viralScore: normalizeScore(data?.viralScore, 58),
    authenticityScore: normalizeScore(data?.authenticityScore, 64),
    clarityScore: normalizeScore(data?.clarityScore, 66),
    emotionalScore: normalizeScore(data?.emotionalScore, 55),
    curiosityScore: normalizeScore(data?.curiosityScore, 57),
    hookScore: normalizeScore(data?.hookScore, 54),
    ctaScore: normalizeScore(data?.ctaScore, 52),
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

  const prompt = `
You are a senior content strategist and elite social media critic.

Your job:
- analyze posts honestly
- score like a real expert, not politely
- identify the biggest weaknesses first
- give practical next-step recommendations
- produce a stronger improved version

POST:
${post}

PLATFORM:
${platform}

LANGUAGE:
${language}

You must score these dimensions:
- viralScore
- authenticityScore
- clarityScore
- emotionalScore
- curiosityScore
- hookScore
- ctaScore

Scoring rules:
- scores must be integers 0-100
- average content should not get premium scores
- weak hook = low hookScore
- robotic tone = lower authenticityScore
- vague message = lower clarityScore
- low emotional pull = lower emotionalScore
- low intrigue = lower curiosityScore
- weak ending / no action = lower ctaScore
- viralScore should reflect overall shareability and stopping power

Analysis rules:
- be sharp, practical, and specific
- do not use generic praise
- point to the most important weaknesses first
- recommendations must be actionable
- improvedVersion must be clearly better than the original
- improvedVersion must be more human, sharper, and more platform-native

Return ONLY valid JSON in this exact shape:
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
