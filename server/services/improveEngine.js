import OpenAI from "openai";
import { safeJsonParse } from "../utils/safeParse.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function normalizeArray(value, limit = 6) {
  if (!Array.isArray(value)) return [];
  return value.map((i) => String(i || "").trim()).filter(Boolean).slice(0, limit);
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function detectGoalBehavior(goal) {
  const g = String(goal || "").toLowerCase();

  if (g.includes("hook")) {
    return "Focus heavily on rewriting the opening to be sharp, curiosity-driven and scroll-stopping.";
  }

  if (g.includes("cta")) {
    return "Focus heavily on improving the ending and call-to-action to drive response.";
  }

  if (g.includes("viral")) {
    return "Increase punch, emotional triggers, and shareability without sounding fake.";
  }

  if (g.includes("human") || g.includes("authentic")) {
    return "Reduce AI tone. Make it sound natural, personal, and human.";
  }

  if (g.includes("emotional")) {
    return "Increase emotional depth and relatability.";
  }

  if (g.includes("clear")) {
    return "Simplify language and improve clarity.";
  }

  return "Improve overall quality, flow, clarity and engagement.";
}

function normalizeImproveResult(data, originalPost) {
  const improvedPost =
    normalizeString(data?.improvedPost) ||
    normalizeString(data?.moreAuthenticVersion) ||
    originalPost;

  return {
    strengths: normalizeArray(data?.strengths),
    weaknesses: normalizeArray(data?.weaknesses),
    improvedPost,
    moreViralVersion: normalizeString(data?.moreViralVersion, improvedPost),
    moreAuthenticVersion: normalizeString(data?.moreAuthenticVersion, improvedPost),
    tips: normalizeArray(data?.tips)
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

  const goalBehavior = detectGoalBehavior(goal);

  const prompt = `
You are an elite content editor.

Your job:
- make content feel human
- remove AI tone
- sharpen wording
- improve engagement

POST:
${post}

GOAL:
${goal}

SPECIAL INSTRUCTION:
${goalBehavior}

STYLE:
${style}

PLATFORM:
${platform}

LANGUAGE:
${language}

You must return 3 DIFFERENT versions:

1. improvedPost (balanced best version)
2. moreViralVersion (high engagement)
3. moreAuthenticVersion (most human)

Rules:
- no generic rewriting
- no repeating structure
- must feel written by a real person
- each version must be meaningfully different

Return JSON:
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

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeImproveResult(parsed, post);
}
