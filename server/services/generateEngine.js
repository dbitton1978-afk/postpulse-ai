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

function normalizeLanguage(language) {
  return language === "he" ? "he" : "en";
}

function getLanguageLabel(language) {
  return normalizeLanguage(language) === "he" ? "Hebrew" : "English";
}

function getLanguageInstruction(language) {
  return normalizeLanguage(language) === "he"
    ? "Write EVERYTHING in natural Hebrew only. All returned fields must be in Hebrew."
    : "Write EVERYTHING in natural English only. All returned fields must be in English.";
}

function detectGoalBehavior(goal) {
  const g = String(goal || "").toLowerCase();

  if (g.includes("hook") || g.includes("פתיחה") || g.includes("הוק")) {
    return {
      mode: "hook",
      instruction:
        "Focus first on rewriting the opening so it becomes sharper, more curiosity-driven, and more scroll-stopping."
    };
  }

  if (g.includes("cta") || g.includes("פעולה") || g.includes("הנעה")) {
    return {
      mode: "cta",
      instruction:
        "Focus first on improving the ending and call to action so it feels stronger, clearer, and more action-driving."
    };
  }

  if (g.includes("viral") || g.includes("engagement") || g.includes("ויראל") || g.includes("מעורבות")) {
    return {
      mode: "viral",
      instruction:
        "Increase punch, tension, curiosity, and shareability without sounding fake, forced, or exaggerated."
    };
  }

  if (g.includes("human") || g.includes("authentic") || g.includes("אנושי") || g.includes("אותנט")) {
    return {
      mode: "human",
      instruction:
        "Aggressively reduce AI tone. Make the post sound more natural, personal, believable, and human."
    };
  }

  if (g.includes("emotional") || g.includes("רגש")) {
    return {
      mode: "emotional",
      instruction:
        "Increase emotional depth, relatability, and feeling without becoming melodramatic."
    };
  }

  if (g.includes("clear") || g.includes("ברור") || g.includes("בהיר")) {
    return {
      mode: "clarity",
      instruction:
        "Simplify and sharpen the message. Remove noise and make the point easier to understand."
    };
  }

  if (g.includes("professional") || g.includes("מקצוע")) {
    return {
      mode: "professional",
      instruction:
        "Make the writing more polished, credible, and professionally sharp."
    };
  }

  return {
    mode: "balanced",
    instruction:
      "Improve the post holistically: stronger wording, better flow, more clarity, better human tone, and better engagement."
  };
}

function normalizeImproveResult(data, originalPost, language) {
  const isHebrew = normalizeLanguage(language) === "he";

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
    tips: normalizeArray(
      data?.tips,
      6
    ).length
      ? normalizeArray(data?.tips, 6)
      : isHebrew
        ? ["חדד את הפתיחה", "הפוך את המסר ליותר טבעי", "סיים עם הנעה ברורה יותר"]
        : ["Sharpen the opening", "Make the tone more natural", "End with a clearer CTA"]
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

  const safeLanguage = normalizeLanguage(language);
  const goalBehavior = detectGoalBehavior(goal);

  const prompt = `
You are an elite content editor and rewrite strategist.

TASK:
Improve this social media post so it performs better and sounds more human.

POST:
${post}

GOAL:
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
${getLanguageLabel(safeLanguage)}

CRITICAL LANGUAGE RULE:
${getLanguageInstruction(safeLanguage)}

OUTPUT REQUIREMENTS:
You must return 3 clearly different versions:

1. improvedPost
- best balanced version
- strongest overall version
- should improve the post according to the goal first

2. moreViralVersion
- more punchy
- more scroll-stopping
- stronger engagement energy
- must feel clearly different from improvedPost

3. moreAuthenticVersion
- more natural
- more human
- warmer and more believable
- must feel clearly different from improvedPost

RULES:
- no generic filler
- no robotic phrasing
- no fake hype
- no repeated sentence patterns
- do not return 3 versions that feel almost identical
- keep the writing aligned with the platform
- improve according to the requested goal first

Also return:
- strengths
- weaknesses
- practical tips

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
    temperature: 0.72
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(text);

  return normalizeImproveResult(parsed, post, safeLanguage);
}
