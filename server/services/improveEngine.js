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

function detectGoalBehavior(goal) {
  const g = String(goal || "").toLowerCase();

  if (g.includes("hook")) {
    return {
      mode: "hook",
      instruction:
        "Focus first on the opening. The first line must become sharper, more curiosity-driven, and more scroll-stopping."
    };
  }

  if (g.includes("cta")) {
    return {
      mode: "cta",
      instruction:
        "Focus first on the ending. The CTA must become more natural, more persuasive, and more action-driving."
    };
  }

  if (g.includes("viral") || g.includes("engagement")) {
    return {
      mode: "viral",
      instruction:
        "Increase punch, tension, curiosity, and shareability without becoming fake, cheesy, or exaggerated."
    };
  }

  if (g.includes("human") || g.includes("authentic")) {
    return {
      mode: "human",
      instruction:
        "Reduce AI feel aggressively. Make the writing sound more human, more natural, more believable, and more personal."
    };
  }

  if (g.includes("emotional")) {
    return {
      mode: "emotional",
      instruction:
        "Increase emotional depth, relatability, and feeling without becoming melodramatic."
    };
  }

  if (g.includes("clear")) {
    return {
      mode: "clarity",
      instruction:
        "Simplify, tighten, and clarify the message. Remove noise and make the value easier to understand."
    };
  }

  if (g.includes("professional")) {
    return {
      mode: "professional",
      instruction:
        "Make the post sound more polished, credible, authoritative, and professionally sharp."
    };
  }

  if (g.includes("curious")) {
    return {
      mode: "curiosity",
      instruction:
        "Increase intrigue, open loops, and forward momentum so the reader wants to keep reading."
    };
  }

  if (g.includes("sharp")) {
    return {
      mode: "sharpness",
      instruction:
        "Make the post more direct, cleaner, tighter, and sharper line by line."
    };
  }

  return {
    mode: "balanced",
    instruction:
      "Improve the post holistically: stronger wording, better flow, more clarity, more humanity, and stronger engagement."
  };
}

function normalizeImproveResult(data, originalPost) {
  const improvedPost =
    normalizeString(data?.improvedPost) ||
    normalizeString(data?.moreAuthenticVersion) ||
    normalizeString(data?.moreViralVersion) ||
    originalPost;

  let moreViralVersion =
    normalizeString(data?.moreViralVersion) ||
    improvedPost ||
    originalPost;

  let moreAuthenticVersion =
    normalizeString(data?.moreAuthenticVersion) ||
    improvedPost ||
    originalPost;

  if (moreViralVersion === improvedPost) {
    moreViralVersion = normalizeString(data?.moreViralVersion, improvedPost);
  }

  if (moreAuthenticVersion === improvedPost) {
    moreAuthenticVersion = normalizeString(data?.moreAuthenticVersion, improvedPost);
  }

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

  const goalBehavior = detectGoalBehavior(goal);

  const prompt = `
You are an elite content editor and rewriting strategist.

Your task is to improve a social media post so it becomes:
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

GOAL MODE:
${goalBehavior.mode}

SPECIAL INSTRUCTION:
${goalBehavior.instruction}

STYLE:
${style}

PLATFORM:
${platform}

LANGUAGE:
${language}

You must produce THREE CLEARLY DIFFERENT outputs:

1. improvedPost
- the best balanced version
- strongest overall
- best final version for the user
- should improve the post according to the goal first

2. moreViralVersion
- clearly more punchy than improvedPost
- stronger scroll-stopping energy
- stronger tension / curiosity / shareability
- must feel noticeably different from improvedPost

3. moreAuthenticVersion
- clearly more natural and human than improvedPost
- more personal, more believable, warmer tone
- must feel noticeably different from improvedPost

Critical rules:
- DO NOT return 3 similar rewrites
- each version must feel meaningfully different in tone and purpose
- improvedPost = best balanced version
- moreViralVersion = best performance-oriented version
- moreAuthenticVersion = best human-sounding version
- no generic filler
- no robotic phrasing
- no fake hype
- no repetitive sentence patterns
- keep the post aligned with the platform
- if goal is hook-related, improve the opening first
- if goal is CTA-related, improve the ending first
- if goal is clarity-related, simplify and sharpen
- if goal is emotional, add emotional depth naturally
- if goal is viral, increase punch carefully
- if goal is human/authentic, aggressively reduce AI feel

Also return:
- strengths
- weaknesses
- practical tips

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
    temperature: 0.76
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeImproveResult(parsed, post);
}
