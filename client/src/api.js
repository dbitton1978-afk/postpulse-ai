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
    he: "קבליסטי, עמוק, מסתורי, חכם, רוחני, עם שכבות משמעות",
    en: "kabbalistic, deep, mystical, wise, spiritual, layered"
  },
  mentor: {
    he: "מנטורי, חד, בטוח, מעצים, אנושי ובהיר",
    en: "mentor-like, sharp, confident, empowering, human and clear"
  },
  humorous: {
    he: "הומוריסטי, שנון, קליל אבל חכם",
    en: "humorous, witty, clever, light but smart"
  },
  spiritual: {
    he: "רוחני, עמוק, רגשי, מחבר, מעורר השראה",
    en: "spiritual, deep, emotional, connective, inspiring"
  },
  emotional: {
    he: "רגשי, אנושי, פגיע, כן, חודר ללב",
    en: "emotional, human, vulnerable, honest, heart-piercing"
  },
  professional: {
    he: "מקצועי, חד, אמין, סמכותי, נקי ומדויק",
    en: "professional, sharp, credible, authoritative, polished and precise"
  }
};

const PLATFORM_MAP = {
  instagram: {
    he: {
      tone: "אישי, רגשי, זורם, נעים לקריאה",
      cta: "CTA טבעי לשמירה, תגובה או שיתוף",
      hashtags: "6-8 hashtags רלוונטיים",
      length: "אורך בינוני, מותאם למובייל"
    },
    en: {
      tone: "personal, emotional, flowing, easy to read",
      cta: "natural CTA for save, comment, or share",
      hashtags: "6-8 relevant hashtags",
      length: "medium length, mobile-friendly"
    }
  },
  facebook: {
    he: {
      tone: "אישי, שיחתי, מחבר, מעט יותר סיפורי",
      cta: "CTA טבעי לתגובה, שיתוף או דעה",
      hashtags: "0-4 hashtags בלבד אם רלוונטי",
      length: "אפשר מעט יותר אורך"
    },
    en: {
      tone: "personal, conversational, connective, slightly more story-driven",
      cta: "natural CTA for opinion, comment, or share",
      hashtags: "0-4 hashtags only if relevant",
      length: "can be slightly longer"
    }
  },
  linkedin: {
    he: {
      tone: "מקצועי, חד, חכם, אמין",
      cta: "CTA אינטליגנטי ולא אגרסיבי",
      hashtags: "3-5 hashtags לכל היותר",
      length: "קצר עד בינוני עם ערך ברור"
    },
    en: {
      tone: "professional, sharp, thoughtful, credible",
      cta: "intelligent CTA, not aggressive",
      hashtags: "3-5 hashtags at most",
      length: "short to medium with clear value"
    }
  },
  tiktok: {
    he: {
      tone: "מהיר, חד, מסקרן, ישיר",
      cta: "CTA קצר וקליל",
      hashtags: "4-6 hashtags רלוונטיים",
      length: "קצר"
    },
    en: {
      tone: "fast, punchy, curiosity-driven, direct",
      cta: "short and light CTA",
      hashtags: "4-6 relevant hashtags",
      length: "short"
    }
  }
};

function normalizeLanguage(language) {
  return language === "he" ? "he" : "en";
}

function normalizePlatform(platform) {
  const safePlatform = String(platform || "instagram").toLowerCase();
  return PLATFORM_MAP[safePlatform] ? safePlatform : "instagram";
}

function getLanguageLabel(language) {
  return normalizeLanguage(language) === "he" ? "Hebrew" : "English";
}

function getStyleText(style, language) {
  const safeLanguage = normalizeLanguage(language);
  return STYLE_MAP[style]?.[safeLanguage] || STYLE_MAP.professional[safeLanguage];
}

function getPlatformRules(platform, language) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  return PLATFORM_MAP[safePlatform][safeLanguage];
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeJsonParse(text) {
  if (!text) return null;

  const direct = tryParseJson(text);
  if (direct) return direct;

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const sliced = text.slice(firstBrace, lastBrace + 1);
    const parsed = tryParseJson(sliced);
    if (parsed) return parsed;
  }

  return null;
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

function normalizeHashtagsByPlatform(hashtags, platform) {
  const safePlatform = normalizePlatform(platform);
  const normalized = cleanArray(hashtags).map((tag) =>
    tag.startsWith("#") ? tag : `#${tag}`
  );

  if (safePlatform === "linkedin") return normalized.slice(0, 5);
  if (safePlatform === "facebook") return normalized.slice(0, 4);
  if (safePlatform === "tiktok") return normalized.slice(0, 6);
  return normalized.slice(0, 8);
}

function normalizeGenerateResponse(data, platform) {
  return {
    title: cleanString(data?.title),
    hook: cleanString(data?.hook),
    body: cleanString(data?.body),
    cta: cleanString(data?.cta),
    hashtags: normalizeHashtagsByPlatform(data?.hashtags, platform),
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

async function askAI(systemPrompt, userPrompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_completion_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${systemPrompt}
Return JSON only.
No markdown.
No code fences.
`
      },
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
    const safePlatform = normalizePlatform(platform);
    const styleText = getStyleText(style, safeLanguage);
    const platformRules = getPlatformRules(safePlatform, safeLanguage);

    const systemPrompt = `
You are an elite social media writer.
Write like a real human.
Be platform-native, clear, sharp, and concise.

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
Write one strong social media post.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}
Topic: ${topic}
Target audience: ${targetAudience}
Goal: ${goal}
Style: ${styleText}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Hashtags: ${platformRules.hashtags}
- Length: ${platformRules.length}

Rules:
- everything must be in ${getLanguageLabel(safeLanguage)}
- strong hook
- clear body
- natural CTA
- avoid generic AI tone
- make it feel human and native to the platform
`;
    const raw = await askAI(systemPrompt, userPrompt);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response"
      });
    }

    const normalized = normalizeGenerateResponse(parsed, safePlatform);

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
    const safePlatform = normalizePlatform(platform);
    const styleText = getStyleText(style, safeLanguage);
    const platformRules = getPlatformRules(safePlatform, safeLanguage);

    const systemPrompt = `
You are an elite social media editor.
Improve text by platform.
Be sharp, useful, human, and concise.

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

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}
Desired style: ${styleText}
Improvement goal: ${goal}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Length: ${platformRules.length}

Original post:
${post}

Rules:
- everything must be in ${getLanguageLabel(safeLanguage)}
- explain strengths briefly
- explain weaknesses briefly
- improve for this platform
- make it more human
- tips must be practical and short
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
    const safePlatform = normalizePlatform(platform);
    const platformRules = getPlatformRules(safePlatform, safeLanguage);

    const systemPrompt = `
You are an elite social media analyst.
Analyze by platform.
Be concise, specific, human, and practical.

Required JSON structure:
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

    const userPrompt = `
Analyze this post.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Length: ${platformRules.length}

Post:
${post}

Rules:
- everything must be in ${getLanguageLabel(safeLanguage)}
- all scores must be 0-100
- be realistic
- keep summary short and useful
- explain what works on this platform
- explain what hurts performance on this platform
- improved version must fit this platform
- give specific actions to raise viral score
- give specific actions to raise authenticity score
- give specific actions to raise emotional score
- give specific actions to raise curiosity score

Curiosity score means:
- how much the post creates interest
- how much it makes people want to keep reading
- how much it creates tension, intrigue, surprise, or pull
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
