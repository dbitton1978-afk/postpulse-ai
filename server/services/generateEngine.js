import OpenAI from "openai";
import { safeJsonParse } from "../utils/safeParse.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function normalizeArray(value, limit = 10) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeGenerateResult(data, topic) {
  return {
    title: normalizeString(data?.title, topic ? `Post about ${topic}` : ""),
    hook: normalizeString(data?.hook),
    body: normalizeString(data?.body),
    cta: normalizeString(data?.cta),
    hashtags: normalizeArray(data?.hashtags, 8),
    shortVersion: normalizeString(data?.shortVersion),
    alternativeVersion: normalizeString(data?.alternativeVersion)
  };
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

  const prompt = `
You are an elite social media strategist and conversion-minded writer.

Your job is to create posts that feel:
- human
- sharp
- emotionally intelligent
- platform-native
- non-generic
- lower in AI feel

INPUT:
Topic: ${topic}
Target Audience: ${targetAudience}
Goal: ${goal}
Style: ${style}
Platform: ${platform}
Language: ${language}

Think silently before writing:
1. What is the strongest angle here?
2. What would make someone stop scrolling?
3. What emotional or strategic lever should lead the post?
4. What would make this sound like a real human and not AI?
5. What kind of CTA fits this platform naturally?

Writing rules:
- no generic filler
- no robotic phrasing
- no fake hype
- no repetitive structure
- no vague motivational language
- each sentence must earn its place
- hook must create stopping power
- body must feel natural and readable
- CTA must feel native, not forced
- hashtags must be relevant, clean, not spammy
- shortVersion must still feel strong
- alternativeVersion must be meaningfully different, not a copy

Platform behavior:
- Instagram: sharper emotional flow, scroll-stopping opening, punchy CTA
- Facebook: more conversational and relatable
- LinkedIn: more authority, clarity, value, credibility
- TikTok: faster rhythm, stronger curiosity, tighter punch

Return ONLY valid JSON in this exact format:
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
    temperature: 0.75
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeGenerateResult(parsed, topic);
}
