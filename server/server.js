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

const STYLE_MAP = {
  kabbalist: {
    he: "קבליסטי, עמוק, מסתורי, חכם, רוחני, סמלי, עם שכבות משמעות ותודעה",
    en: "kabbalistic, deep, mystical, wise, spiritual, symbolic, layered and consciousness-oriented"
  },
  mentor: {
    he: "מנטורי, חד, בטוח, מעצים, מוביל, אנושי ובהיר",
    en: "mentor-like, sharp, confident, empowering, insightful, human and clear"
  },
  humorous: {
    he: "הומוריסטי, שנון, קליל אבל חכם, עם עקיצה טובה ועומק",
    en: "humorous, witty, clever, light but smart, with punch and depth"
  },
  spiritual: {
    he: "רוחני, עמוק, רגשי, מחבר, רך אך מדויק, מעורר השראה ומודעות",
    en: "spiritual, deep, emotional, connective, soft yet precise, inspiring and aware"
  },
  emotional: {
    he: "רגשי, אנושי, פגיע, חודר ללב, כן, עמוק ומלא אמת רגשית",
    en: "emotional, deeply human, vulnerable, heart-piercing, honest and emotionally true"
  },
  professional: {
    he: "מקצועי, חד, אמין, סמכותי, נקי, מדויק ולא גנרי",
    en: "professional, sharp, credible, authoritative, polished, precise and non-generic"
  }
};

const PLATFORM_MAP = {
  instagram: {
    he: `
פלטפורמה: Instagram
כתוב כמו פוסט אינסטגרם איכותי:
- Hook חזק מאוד בשורה ראשונה
- קצב קריא, זורם, נעים לעין
- רגשי, אישי, אנושי, זכיר
- CTA טבעי לשמירה / תגובה / שיתוף
- 6-10 hashtags רלוונטיים
- מתאים לקריאה במובייל
- לא ארוך מדי, לא קצר מדי
`,
    en: `
Platform: Instagram
Write like a strong Instagram post:
- very strong first-line hook
- readable, flowing, mobile-friendly rhythm
- emotional, personal, human, memorable
- natural CTA for save / comment / share
- 6-10 relevant hashtags
- not too long, not too short
`
  },
  facebook: {
    he: `
פלטפורמה: Facebook
כתוב כמו פוסט פייסבוק חזק:
- יותר אישי ושיחתי
- אפשר קצת יותר אורך וסיפור
- נבנה לחיבור, תגובות ודיון
- CTA טבעי לתגובה / שיתוף / דעה
- hashtags רק אם באמת מוסיפים ערך
- להישמע אנושי ולא "משווק"
`,
    en: `
Platform: Facebook
Write like a strong Facebook post:
- more personal and conversational
- can be slightly longer and more story-driven
- built for connection, comments and discussion
- natural CTA for opinion / comment / share
- hashtags only if they truly add value
- must sound human, not markety
`
  },
  linkedin: {
    he: `
פלטפורמה: LinkedIn
כתוב כמו פוסט לינקדאין חזק:
- מקצועי, חד, אמין, חכם
- תובנה ברורה או לקח מעשי
- בנוי לאמון, סמכות וערך
- פחות האשטגים, מקסימום 3-5
- CTA אינטליגנטי ולא אגרסיבי
- לא סלנג מיותר
- לא להישמע כמו קלישאה עסקית
`,
    en: `
Platform: LinkedIn
Write like a strong LinkedIn post:
- professional, sharp, credible and thoughtful
- clear insight or practical takeaway
- built for trust, authority and value
- fewer hashtags, max 3-5
- intelligent CTA, not aggressive
- no unnecessary slang
- avoid business clichés
`
  },
  tiktok: {
    he: `
פלטפורמה: TikTok
כתוב כמו טקסט לטיקטוק / caption חד:
- קצר יותר
- ישיר, מהיר, מסקרן
- Hook אגרסיבי יחסית
- משפטים קצרים עם קצב
- CTA קליל ומהיר
- hashtags רלוונטיים אך לא כבדים
- חייב למשוך בשניות הראשונות
`,
    en: `
Platform: TikTok
Write like a strong TikTok caption:
- shorter
- direct, fast, curiosity-driven
- relatively aggressive hook
- short punchy sentences
- light and quick CTA
- relevant but not heavy hashtags
- must grab attention instantly
`
  }
};

function normalizeLanguage(language) {
  return language === "he" ? "he" : "en";
}

function getLanguageLabel(language) {
  return normalizeLanguage(language) === "he" ? "Hebrew" : "English";
}

function getStyleText(style, language) {
  const safeLanguage = normalizeLanguage(language);
  return STYLE_MAP[style]?.[safeLanguage] || STYLE_MAP.professional[safeLanguage];
}

function getPlatformText(platform, language) {
  const safeLanguage = normalizeLanguage(language);
  return PLATFORM_MAP[platform]?.[safeLanguage] || PLATFORM_MAP.instagram[safeLanguage];
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function clampScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function cleanArray(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function cleanString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function normalizeGenerateResponse(data, platform) {
  const safePlatform = String(platform || "instagram").toLowerCase();
  const hashtags = cleanArray(data?.hashtags).map((tag) =>
    tag.startsWith("#") ? tag : `#${tag}`
  );

  let finalHashtags = hashtags;

  if (safePlatform === "linkedin") {
    finalHashtags = hashtags.slice(0, 5);
  }

  if (safePlatform === "facebook") {
    finalHashtags = hashtags.slice(0, 4);
  }

  if (safePlatform === "tiktok") {
    finalHashtags = hashtags.slice(0, 6);
  }

  return {
    title: cleanString(data?.title),
    hook: cleanString(data?.hook),
    body: cleanString(data?.body),
    cta: cleanString(data?.cta),
    hashtags: finalHashtags,
    shortVersion: cleanString(data?.shortVersion),
    alternativeVersion: cleanString(data?.alternativeVersion)
  };
}

function normalizeImproveResponse(data) {
  return {
    strengths: cleanArray(data?.strengths),
    weaknesses: cleanArray(data?.weaknesses),
    improvedPost: cleanString(data?.improvedPost),
    moreViralVersion: cleanString(data?.moreViralVersion),
    moreAuthenticVersion: cleanString(data?.moreAuthenticVersion),
    tips: cleanArray(data?.tips)
  };
}

function normalizeAnalyzeResponse(data) {
  return {
    viralScore: clampScore(data?.viralScore),
    authenticityScore: clampScore(data?.authenticityScore),
    clarityScore: clampScore(data?.clarityScore),
    emotionalScore: clampScore(data?.emotionalScore),
    hookScore: clampScore(data?.hookScore),
    ctaScore: clampScore(data?.ctaScore),
    summary: cleanString(data?.summary),
    whatWorks: cleanArray(data?.whatWorks),
    whatHurts: cleanArray(data?.whatHurts),
    improvements: cleanArray(data?.improvements),
    improvedVersion: cleanString(data?.improvedVersion)
  };
}

async function askAI(systemPrompt, userPrompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return response.choices[0]?.message?.content || "{}";
}

function validateApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
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

app.post("/api/generate-post", async (req, res) => {
  try {
    if (!validateApiKey()) {
      return res.status(500).json({
        success: false,
        message: "Missing OPENAI_API_KEY"
      });
    }

    const {
      topic = "",
      targetAudience = "",
      language = "en",
      style = "professional",
      goal = "",
      platform = "instagram"
    } = req.body || {};

    if (!String(topic).trim()) {
      return res.status(400).json({
        success: false,
        message: "topic is required"
      });
    }

    const safeLanguage = normalizeLanguage(language);
    const styleText = getStyleText(style, safeLanguage);
    const platformText = getPlatformText(platform, safeLanguage);

    const systemPrompt = `
You are an elite social media writer with exceptional emotional intelligence, platform awareness, psychological insight, and strong editorial taste.

Write like a real human, not like AI.

Core rules:
- natural and conversational
- emotionally real
- sharp but human
- avoid robotic structure
- avoid filler
- avoid cliché inspiration language
- avoid fake hype
- avoid generic marketing language
- every output must feel specific, alive, and platform-native

If the writing sounds generic, rewrite it until it feels human and memorable.

Always return valid JSON only.

Required JSON structure:
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

    const userPrompt = `
Write a strong social media post.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(safeLanguage)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

${platformText}

Topic: ${topic}
Target audience: ${targetAudience}
Goal: ${goal}
Style: ${styleText}

Writing requirements:
- write with emotional intelligence
- make the hook strong and native to the platform
- make the body feel human, specific, and readable
- make the CTA natural for that platform
- adapt length, rhythm, structure, and tone to the selected platform
- avoid repeating obvious ideas
- avoid sounding like a template

If style is emotional:
- increase emotional honesty
- allow vulnerability and tenderness when relevant
- keep it elegant and believable

Return JSON only.
`;

    const raw = await askAI(systemPrompt, userPrompt);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response"
      });
    }

    const normalized = normalizeGenerateResponse(parsed, platform);

    return res.json({
      success: true,
      data: normalized
    });
  } catch (error) {
    console.error("generate-post error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate post"
    });
  }
});

app.post("/api/improve-post", async (req, res) => {
  try {
    if (!validateApiKey()) {
      return res.status(500).json({
        success: false,
        message: "Missing OPENAI_API_KEY"
      });
    }

    const {
      post = "",
      language = "en",
      style = "professional",
      goal = "make it stronger",
      platform = "instagram"
    } = req.body || {};

    if (!String(post).trim()) {
      return res.status(400).json({
        success: false,
        message: "post is required"
      });
    }

    const safeLanguage = normalizeLanguage(language);
    const styleText = getStyleText(style, safeLanguage);
    const platformText = getPlatformText(platform, safeLanguage);

    const systemPrompt = `
You are an elite social media strategist and editor.

You understand how strong writing changes by platform.

Write like a real human, not like AI.

Core rules:
- no robotic phrasing
- no generic tips
- no empty marketing talk
- no cliché inspiration lines
- feedback must be precise, useful, and platform-aware
- rewritten outputs must feel stronger, sharper, and more human

Always return valid JSON only.

Required JSON structure:
{
  "strengths": [],
  "weaknesses": [],
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "tips": []
}
`;

    const userPrompt = `
Analyze and improve this post.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(safeLanguage)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

${platformText}

Original post:
${post}

Desired style: ${styleText}
Improvement goal: ${goal}

Instructions:
- judge the text according to the selected platform
- explain what works and what weakens performance on that platform
- improve rhythm, clarity, emotional pull, hook strength, and CTA fit
- make the rewritten output feel platform-native
- make the more viral version stronger without becoming fake
- make the more authentic version feel more human and real
- tips must be practical and not generic

Return JSON only.
`;

    const raw = await askAI(systemPrompt, userPrompt);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response"
      });
    }

    const normalized = normalizeImproveResponse(parsed);

    return res.json({
      success: true,
      data: normalized
    });
  } catch (error) {
    console.error("improve-post error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to improve post"
    });
  }
});

app.post("/api/analyze-post", async (req, res) => {
  try {
    if (!validateApiKey()) {
      return res.status(500).json({
        success: false,
        message: "Missing OPENAI_API_KEY"
      });
    }

    const { post = "", language = "en", platform = "instagram" } = req.body || {};

    if (!String(post).trim()) {
      return res.status(400).json({
        success: false,
        message: "post is required"
      });
    }

    const safeLanguage = normalizeLanguage(language);
    const platformText = getPlatformText(platform, safeLanguage);

    const systemPrompt = `
You are an elite social media analyst with deep platform awareness, emotional intelligence, editorial judgment, and strategic communication skill.

Write like a real human, not like AI.

Core rules:
- no robotic summaries
- no generic advice
- no cliché analysis language
- be specific, sharp, and useful
- analyze the text according to the selected platform

Always return valid JSON only.

Required JSON structure:
{
  "viralScore": 0,
  "authenticityScore": 0,
  "clarityScore": 0,
  "emotionalScore": 0,
  "hookScore": 0,
  "ctaScore": 0,
  "summary": "",
  "whatWorks": [],
  "whatHurts": [],
  "improvements": [],
  "improvedVersion": ""
}
`;

    const userPrompt = `
Analyze this post.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(safeLanguage)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

${platformText}

Post:
${post}

Instructions:
- evaluate the post according to the selected platform
- all scores must be 0-100
- judge hook quality, clarity, emotional pull, authenticity, viral potential, and CTA fit
- explain what works specifically for that platform
- explain what hurts performance specifically for that platform
- improved version must be more native to that platform
- keep the summary insightful and concise

Return JSON only.
`;

    const raw = await askAI(systemPrompt, userPrompt);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response"
      });
    }

    const normalized = normalizeAnalyzeResponse(parsed);

    return res.json({
      success: true,
      data: normalized
    });
  } catch (error) {
    console.error("analyze-post error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to analyze post"
    });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use((error, req, res, next) => {
  console.error("server error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
