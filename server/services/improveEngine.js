import OpenAI from "openai";
import { safeJsonParse } from "../utils/safeParse.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

function normalizeImproveResult(data, originalPost) {
  const improvedPost =
    normalizeString(data?.improvedPost) ||
    normalizeString(data?.moreAuthenticVersion) ||
    normalizeString(data?.moreViralVersion) ||
    originalPost;

  const moreViralVersion =
    normalizeString(data?.moreViralVersion) ||
    improvedPost ||
    originalPost;

  const moreAuthenticVersion =
    normalizeString(data?.moreAuthenticVersion) ||
    improvedPost ||
    originalPost;

  return {
    strengths: normalizeArray(data?.strengths, 6),
    weaknesses: normalizeArray(data?.weaknesses, 6),
    improvedPost,
    moreViralVersion,
    moreAuthenticVersion,
    tips: normalizeArray(data?.tips, 6)
  };
}

export async function improveEngine(input) {
  const {
    post,
    goal = "",
    style = "professional",
    platform = "instagram",
    language = "en"
  } = input;

  const prompt = `
You are an elite content editor and rewriting strategist.

Your task is to improve a social media post in a way that feels:
- more human
- more natural
- sharper
- more readable
- less AI-like
- more platform-native

INPUT POST:
${post}

IMPROVEMENT GOAL:
${goal}

STYLE:
${style}

PLATFORM:
${platform}

LANGUAGE:
${language}

You must produce THREE clearly different outputs:

1. improvedPost
- the best balanced version
- stronger overall
- more human
- clearer
- better rhythm
- better wording
- keep the original intent

2. moreViralVersion
- more punchy
- more scroll-stopping
- more engaging
- stronger tension / curiosity / shareability
- but not cringe, not exaggerated

3. moreAuthenticVersion
- more natural
- more personal
- more believable
- lower AI feel
- warmer / more human tone

Also return:
- strengths
- weaknesses
- practical tips

Rules:
- do not output generic filler
- do not sound robotic
- do not repeat the same version 3 times
- each version must feel meaningfully different
- keep the post aligned with the platform
- if the goal is hook-related, improve the opening first
- if the goal is CTA-related, improve the ending first
- if the goal is clarity-related, simplify and sharpen
- if the goal is emotional, add emotional depth naturally
- if the goal is viral, increase punch and engagement carefully

Return ONLY valid JSON in this exact format:
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
    temperature: 0.72
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeImproveResult(parsed, post);
}
