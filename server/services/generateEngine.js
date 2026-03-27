import OpenAI from "openai";
import { safeJsonParse } from "../utils/safeParse.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

function getLanguageInstruction(language) {
  return normalizeLanguage(language) === "he"
    ? "Write EVERYTHING in natural Hebrew only. Do not use English at all unless the user explicitly provided an English brand name or platform name. All fields in the JSON must be in Hebrew."
    : "Write EVERYTHING in natural English only. All fields in the JSON must be in English.";
}

function normalizeGenerateResult(data, topic, language) {
  const isHebrew = normalizeLanguage(language) === "he";

  return {
    title: normalizeString(
      data?.title,
      topic ? (isHebrew ? `פוסט על ${topic}` : `Post about ${topic}`) : ""
    ),
    hook: normalizeString(data?.hook),
    body: normalizeString(data?.body),
    cta: normalizeString(data?.cta),
    hashtags: normalizeArray(data?.hashtags, 8),
    shortVersion: normalizeString(data?.shortVersion),
    alternativeVersion: normalizeString(data?.alternativeVersion)
  };
}

function buildGoalBehavior(goal) {
  const g = String(goal || "").toLowerCase();

  if (g.includes("viral") || g.includes("engagement") || g.includes("ויראל") || g.includes("מעורבות")) {
    return "Prioritize scroll-stopping framing, stronger curiosity, sharper energy, and higher engagement potential.";
  }

  if (g.includes("human") || g.includes("authentic") || g.includes("אנושי") || g.includes("אותנט")) {
    return "Prioritize natural human tone, believable phrasing, and low AI feel.";
  }

  if (g.includes("emotional") || g.includes("רגש")) {
    return "Prioritize emotional relevance, feeling, and resonance without becoming melodramatic.";
  }

  if (g.includes("professional") || g.includes("מקצוע")) {
    return "Prioritize authority, clarity, trust, and a polished expert tone.";
  }

  if (
    g.includes("sales") ||
    g.includes("action") ||
    g.includes("conversion") ||
    g.includes("מכירה") ||
    g.includes("פעולה")
  ) {
    return "Prioritize persuasion, clarity of value, and a stronger CTA that drives action naturally.";
  }

  return "Prioritize the strongest balance of hook, human tone, clarity, emotional pull, and platform fit.";
}

export async function generateEngine(input) {
  const {
    topic,
    targetAudience = "",
    goal = "",
    style = "professional",
    platform = "instagram",
    language = "en"
  } = input;

  const safeLanguage = normalizeLanguage(language);
  const goalBehavior = buildGoalBehavior(goal);

  const prompt = `
You are an elite social media strategist and high-level content writer.

Your writing must feel:
- human
- sharp
- platform-native
- emotionally intelligent
- low in AI tone
- non-generic

INPUT:
Topic: ${topic}
Target Audience: ${targetAudience}
Goal: ${goal}
Goal Behavior: ${goalBehavior}
Style: ${style}
Platform: ${platform}
Language: ${getLanguageLabel(safeLanguage)}

CRITICAL LANGUAGE RULE:
${getLanguageInstruction(safeLanguage)}

THINK SILENTLY FIRST:
1. What is the strongest angle for this topic?
2. What would make someone stop scrolling?
3. What emotional lever or tension should lead the post?
4. What would make this feel like a real person wrote it?
5. What CTA would fit this platform naturally?

WRITING RULES:
- Hook must stop the scroll
- Body must feel natural, readable, and sharp
- CTA must feel organic, not forced
- Avoid generic filler
- Avoid robotic phrasing
- Avoid repetitive patterns
- Avoid fake motivational fluff
- Each sentence must earn its place
- Alternative version must be meaningfully different
- Short version must still feel strong and usable

PLATFORM RULES:
- Instagram: punchier, more emotional, more scroll-stopping
- Facebook: more conversational and relatable
- LinkedIn: more authority, clarity, insight, and credibility
- TikTok: faster, tighter, more curiosity-driven

RETURN ONLY VALID JSON:
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
    temperature: 0.78
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeGenerateResult(parsed, topic, safeLanguage);
}
