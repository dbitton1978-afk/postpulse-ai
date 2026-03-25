import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: false
  })
);

app.use(express.json({ limit: "15mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanArray(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function clampScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeLanguage(language) {
  return language === "he" ? "he" : "en";
}

function normalizePlatform(platform) {
  const value = String(platform || "instagram").toLowerCase();
  const allowed = ["instagram", "facebook", "linkedin", "tiktok"];
  return allowed.includes(value) ? value : "instagram";
}

function normalizeStyle(style) {
  const value = String(style || "professional").toLowerCase();
  const allowed = [
    "kabbalist",
    "mentor",
    "humorous",
    "spiritual",
    "emotional",
    "professional"
  ];
  return allowed.includes(value) ? value : "professional";
}

function getLanguageLabel(language) {
  return normalizeLanguage(language) === "he" ? "Hebrew" : "English";
}

function getPlatformGuide(platform, language) {
  const safePlatform = normalizePlatform(platform);
  const safeLanguage = normalizeLanguage(language);

  const map = {
    instagram: {
      he: "פוסט זורם, אישי, חד, עם hook חזק וקריאה טבעית לפעולה",
      en: "flowing, personal, sharp post with a strong hook and natural CTA"
    },
    facebook: {
      he: "פוסט מעט יותר שיחתי וסיפורי, מחבר וקל לקריאה",
      en: "slightly more conversational and story-driven, connective and easy to read"
    },
    linkedin: {
      he: "פוסט מקצועי, חכם, ברור, עם סמכות וערך",
      en: "professional, smart, clear, authority-driven, value-based post"
    },
    tiktok: {
      he: "פוסט קצר, מסקרן, מהיר, חד, עם מתח או עצירה חזקה",
      en: "short, curiosity-driven, fast, punchy post with strong stopping power"
    }
  };

  return map[safePlatform][safeLanguage];
}

function normalizeHashtags(value) {
  return cleanArray(value)
    .map((tag) => {
      const cleanTag = String(tag).replace(/^#+/, "").trim();
      return cleanTag ? `#${cleanTag}` : "";
    })
    .filter(Boolean);
}

function normalizeGenerateData(data) {
  return {
    title: cleanString(data?.title),
    hook: cleanString(data?.hook),
    body: cleanString(data?.body),
    cta: cleanString(data?.cta),
    hashtags: normalizeHashtags(data?.hashtags),
    shortVersion: cleanString(data?.shortVersion),
    alternativeVersion: cleanString(data?.alternativeVersion)
  };
}

function normalizeImproveData(data) {
  return {
    strengths: cleanArray(data?.strengths),
    weaknesses: cleanArray(data?.weaknesses),
    improvedPost: cleanString(data?.improvedPost),
    moreViralVersion: cleanString(data?.moreViralVersion),
    moreAuthenticVersion: cleanString(data?.moreAuthenticVersion),
    tips: cleanArray(data?.tips)
  };
}

function normalizeAnalyzeData(data) {
  return {
    viralScore: clampScore(data?.viralScore),
    authenticityScore: clampScore(data?.authenticityScore),
    clarityScore: clampScore(data?.clarityScore),
    emotionalScore: clampScore(data?.emotionalScore),
    curiosityScore: clampScore(data?.curiosityScore),
    hookScore: clampScore(data?.hookScore),
    ctaScore: clampScore(data?.ctaScore),

    summary: cleanString(data?.summary),
    whatWorks: cleanArray(data?.whatWorks),
    whatHurts: cleanArray(data?.whatHurts),
    improvements: cleanArray(data?.improvements),

    raiseViralScore: cleanArray(data?.raiseViralScore),
    raiseAuthenticityScore: cleanArray(data?.raiseAuthenticityScore),
    raiseEmotionalScore: cleanArray(data?.raiseEmotionalScore),
    raiseCuriosityScore: cleanArray(data?.raiseCuriosityScore),

    improvedVersion: cleanString(data?.improvedVersion)
  };
}

function buildGenerateFallback({ topic, language }) {
  const isHebrew = normalizeLanguage(language) === "he";

  return {
    title: isHebrew ? `פוסט על ${topic}` : `Post about ${topic}`,
    hook: isHebrew
      ? "יש רגעים שבהם הדרך שבה מציגים רעיון משנה את כל התגובה אליו."
      : "Sometimes the way you present an idea changes the entire reaction to it.",
    body: isHebrew
      ? "כדי לגרום לאנשים לעצור באמת, צריך לא רק לדבר על הנושא — אלא לדבר עליו בצורה חדה, אנושית וברורה יותר."
      : "To make people truly stop, you need more than a topic — you need a sharper, more human, and clearer way to present it.",
    cta: isHebrew
      ? "אם זה דיבר אליכם, כתבו לי בתגובות."
      : "If this resonated, share your thoughts in the comments.",
    hashtags: [],
    shortVersion: isHebrew
      ? "אותו רעיון, הרבה יותר חד."
      : "The same idea, much sharper.",
    alternativeVersion: isHebrew
      ? "לפעמים לא צריך לכתוב יותר — צריך לכתוב נכון יותר."
      : "Sometimes you do not need to write more — you need to write better."
  };
}

function buildImproveFallback({ post }) {
  return {
    strengths: [],
    weaknesses: [],
    improvedPost: cleanString(post),
    moreViralVersion: cleanString(post),
    moreAuthenticVersion: cleanString(post),
    tips: []
  };
}

function buildAnalyzeFallback({ post, language, platform }) {
  const isHebrew = normalizeLanguage(language) === "he";
  const safePlatform = normalizePlatform(platform);

  return {
    viralScore: 60,
    authenticityScore: 68,
    clarityScore: 70,
    emotionalScore: 58,
    curiosityScore: 57,
    hookScore: 56,
    ctaScore: 54,
    summary: isHebrew
      ? "יש כאן בסיס טוב, אבל אפשר לחזק חדות, סקרנות וקריאה לפעולה."
      : "There is a solid base here, but it can be sharper, more curiosity-driven, and stronger on CTA.",
    whatWorks: isHebrew
      ? ["הנושא ברור", "יש בסיס לפוסט טוב"]
      : ["The topic is clear", "There is a base for a good post"],
    whatHurts: isHebrew
      ? ["הפתיחה לא מספיק חזקה", "הניסוח מעט כללי"]
      : ["The opening is not strong enough", "The wording is a bit generic"],
    improvements: isHebrew
      ? ["לחזק את המשפט הראשון", "לחדד את הערך לקורא"]
      : ["Strengthen the first sentence", "Clarify the value for the reader"],
    raiseViralScore: isHebrew
      ? ["להתחיל חד יותר", "ליצור יותר מתח"]
      : ["Start more sharply", "Create more tension"],
    raiseAuthenticityScore: isHebrew
      ? ["לדבר פשוט יותר", "להישמע פחות רובוטי"]
      : ["Use simpler wording", "Sound less robotic"],
    raiseEmotionalScore: isHebrew
      ? ["להוסיף חיבור רגשי", "לגעת בצורך אמיתי"]
      : ["Add emotional connection", "Touch a real need"],
    raiseCuriosityScore: isHebrew
      ? ["להשאיר לולאה פתוחה", "לרמוז על תובנה לפני החשיפה"]
      : ["Leave an open loop", "Hint at an insight before revealing it"],
    improvedVersion:
      cleanString(post) ||
      (isHebrew
        ? `אם רוצים שהפוסט יעבוד טוב יותר ב-${safePlatform}, צריך לפתוח חזק יותר ולדבר ברור יותר.`
        : `If you want this post to work better on ${safePlatform}, it needs a stronger opening and clearer wording.`)
  };
}

app.get("/", (req, res) => {
  res.send("PostPulse API is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PostPulse API is running"
  });
});

app.post("/generate-post", async (req, res) => {
  try {
    const topic = cleanString(req.body?.topic);
    const targetAudience = cleanString(req.body?.targetAudience);
    const goal = cleanString(req.body?.goal);
    const style = normalizeStyle(req.body?.style);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const systemPrompt = `
You are a world-class social media content strategist.

You NEVER generate generic AI text.

You ALWAYS:
- think before writing
- build a strategic internal brief
- write like a real human
- optimize for engagement and platform behavior

You specialize in:
- viral hooks
- emotional storytelling
- clear value communication
- high-conversion CTAs
- platform-native writing

Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Topic: ${topic}
Audience: ${targetAudience || "General audience"}
Goal: ${goal || "Create a strong post"}
Style: ${style}
Platform: ${platform}
Language: ${getLanguageLabel(language)}

STEP 1 — Build an internal brief silently:
- best angle
- main emotion
- strongest hook direction
- best CTA direction
- what makes people stop scrolling

STEP 2 — Return JSON only:

{
  "title": "",
  "hook": "",
  "body": "",
  "cta": "",
  "hashtags": [],
  "shortVersion": "",
  "alternativeVersion": ""
}

RULES:
- hook must be strong and scroll-stopping
- body must feel human, not robotic
- CTA must be natural and action-driven
- avoid generic AI phrases
- adapt naturally to ${platform}
- platform guide: ${getPlatformGuide(platform, language)}
- write only in ${getLanguageLabel(language)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, buildGenerateFallback({ topic, language }));
    const normalized = normalizeGenerateData(parsed);

    return res.json({
      success: true,
      data: normalized
    });
  } catch (err) {
    console.error("generate-post error:", err);

    return res.status(500).json({
      success: false,
      error: "Generate failed"
    });
  }
});

app.post("/improve-post", async (req, res) => {
  try {
    const post = cleanString(req.body?.post);
    const goal = cleanString(req.body?.goal);
    const style = normalizeStyle(req.body?.style);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!post) {
      return res.status(400).json({ error: "Post is required" });
    }

    const systemPrompt = `
You are a world-class social media post optimizer.

You do NOT rewrite blindly.

You first understand:
- what is weak
- what should stay
- what should become stronger
- what fits the user's goal
- what fits the platform

You always improve content to feel:
- more human
- sharper
- less generic
- more engaging
- more platform-native

You specialize in:
- stronger hooks
- clearer messaging
- emotional improvement
- viral improvement
- authentic human tone

Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Original post: ${post}
Goal: ${goal || "Make it stronger"}
Style: ${style}
Platform: ${platform}
Language: ${getLanguageLabel(language)}

STEP 1 — Build an internal improvement brief silently:
- what is weak in the original post
- what should be preserved
- what should be improved first
- how to make it stronger for ${platform}
- how to make it sound less AI-generated

STEP 2 — Return JSON only:

{
  "strengths": [],
  "weaknesses": [],
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "tips": []
}

RULES:
- write only in ${getLanguageLabel(language)}
- strengths must be short and real
- weaknesses must be short and real
- improvedPost = best balanced improved version
- moreViralVersion = more attention-grabbing and engaging
- moreAuthenticVersion = more human, more natural, less robotic
- tips must be short and practical
- avoid generic AI phrases
- avoid cringe language
- adapt naturally to ${platform}
- platform guide: ${getPlatformGuide(platform, language)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, buildImproveFallback({ post }));
    const normalized = normalizeImproveData(parsed);

    return res.json({
      success: true,
      data: normalized
    });
  } catch (err) {
    console.error("improve-post error:", err);

    return res.status(500).json({
      success: false,
      error: "Improve failed"
    });
  }
});

app.post("/analyze-post", async (req, res) => {
  try {
    const post = cleanString(req.body?.post);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!post) {
      return res.status(400).json({ error: "Post is required" });
    }

    const systemPrompt = `
You are a world-class social media analyst and post critic.

You analyze realistically and strategically.
You do not flatter weak content.
You score based on actual performance potential.

You evaluate:
- hook strength
- clarity
- authenticity
- emotional impact
- curiosity
- CTA quality
- viral potential

You must give practical and platform-aware feedback.
Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Post: ${post}
Platform: ${platform}
Language: ${getLanguageLabel(language)}

Return JSON only in this exact structure:

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

RULES:
- scores must be integers from 0 to 100
- write only in ${getLanguageLabel(language)}
- be honest, specific, and useful
- do not be generic
- "whatWorks" must mention real strengths only
- "whatHurts" must mention the real weaknesses
- "improvements" must be practical next steps
- "raiseViralScore" should focus on tension, shareability, stronger framing
- "raiseAuthenticityScore" should focus on human tone, natural wording, less robotic phrasing
- "raiseEmotionalScore" should focus on emotional connection, real feeling, stronger relevance
- "raiseCuriosityScore" should focus on open loops, intrigue, stronger reason to keep reading
- "improvedVersion" must be clearly stronger than the original
- adapt to ${platform}
- platform guide: ${getPlatformGuide(platform, language)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, buildAnalyzeFallback({ post, language, platform }));
    const normalized = normalizeAnalyzeData(parsed);

    return res.json({
      success: true,
      data: normalized
    });
  } catch (err) {
    console.error("analyze-post error:", err);

    return res.status(500).json({
      success: false,
      error: "Analyze failed"
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
