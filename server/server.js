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
    he: "קבליסטי, עמוק, סודי, חכם, רוחני, מסתורי, עם שכבות משמעות ותודעה",
    en: "kabbalistic, deep, mystical, wise, spiritual, symbolic, layered and consciousness-oriented"
  },
  mentor: {
    he: "מנטורי, חד, בטוח, מעצים, מוביל, מלא בהבנה אנושית, עומק פנימי ובהירות",
    en: "mentor-like, sharp, confident, empowering, insightful, human and deeply clear"
  },
  humorous: {
    he: "הומוריסטי, שנון, חכם, קליל אבל לא שטחי, עם עומק מתחת לחיוך",
    en: "humorous, witty, clever, light but not shallow, with depth beneath the humor"
  },
  spiritual: {
    he: "רוחני, עמוק, רגשי, מחבר, רך אך מדויק, מעורר השראה ומודעות",
    en: "spiritual, deep, emotional, connective, soft yet precise, inspiring and aware"
  },
  emotional: {
    he: "רגשי, עמוק מאוד, פגיע, אנושי, חודר ללב, מרגש עד דמעות כשמתאים, עם אמת רגשית חזקה וחוכמה עדינה",
    en: "emotional, deeply human, vulnerable, heart-piercing, emotionally powerful, moving to tears when appropriate, with strong emotional truth and gentle wisdom"
  },
  professional: {
    he: "מקצועי, חכם, חד, סמכותי, נקי, מדויק, עמוק ולא גנרי",
    en: "professional, intelligent, sharp, authoritative, polished, precise and non-generic"
  }
};

function getLanguageLabel(language) {
  return language === "he" ? "Hebrew" : "English";
}

function normalizeLanguage(language) {
  return language === "he" ? "he" : "en";
}

function getStyleText(style, language) {
  const safeLanguage = normalizeLanguage(language);
  return STYLE_MAP[style]?.[safeLanguage] || STYLE_MAP.professional[safeLanguage];
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

function normalizeGenerateResponse(data) {
  return {
    title: cleanString(data?.title),
    hook: cleanString(data?.hook),
    body: cleanString(data?.body),
    cta: cleanString(data?.cta),
    hashtags: cleanArray(data?.hashtags).map((tag) =>
      tag.startsWith("#") ? tag : `#${tag}`
    ),
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
    model: "gpt-4.1-mini",
    temperature: 1,
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

    const systemPrompt = `
You are an elite social media writer with exceptional emotional intelligence, psychological insight, human sensitivity, and stylistic maturity.

Write like a real human, not like AI.
Avoid robotic phrasing, generic patterns, and predictable structures.
Avoid generic social media writing. Every output must feel original, deep, emotionally intelligent, and non-repetitive.

The text must feel:
- natural and conversational
- emotionally real
- imperfect in a human way
- varied in rhythm and sentence length
- written by a person with real thoughts and feelings

Avoid:
- perfect marketing tone
- over-structured lists unless necessary
- repetitive sentence patterns
- generic inspiration phrases
- shallow motivational language
- cliché social media wording
- filler
- fake hype
- empty motivation
- obvious AI-sounding transitions

Prefer:
- natural flow
- subtle emotion
- authentic voice
- layered meaning
- sharp but human phrasing
- slightly informal tone when appropriate

If the text sounds like AI, rewrite it until it feels human.

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
Write a strong ${platform} social media post.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(safeLanguage)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Topic: ${topic}
Target audience: ${targetAudience}
Goal: ${goal}
Style: ${styleText}

Depth requirements:
- Write with emotional depth and psychological intelligence
- Avoid clichés, generic advice, and shallow wording
- Make the result feel human, sharp, layered, and emotionally aware
- Prefer insight, tension, contrast, and truth over empty inspiration
- Make the writing feel memorable, natural, and deeply felt
- Write with maximum emotional intelligence and human depth
- Avoid generic marketing language completely
- The hook must feel real, intelligent, and emotionally charged
- The body must have texture, movement, and actual substance
- The CTA must feel natural, persuasive, and psychologically accurate, not forced

If the selected style is emotional:
- push the emotional depth significantly further
- write in a way that can touch the heart deeply
- allow vulnerability, longing, pain, tenderness, love, grief, hope, healing, or inner truth when relevant
- make the writing feel intimate and unforgettable
- it may bring the reader close to tears, but it must remain beautiful, human, and true
- do not become melodramatic or fake

Rules:
- Strong hook
- Natural and authentic writing
- Clear CTA
- 6-10 relevant hashtags
- Return JSON only
`;

    const raw = await askAI(systemPrompt, userPrompt);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response"
      });
    }

    const normalized = normalizeGenerateResponse(parsed);

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
      goal = "make it stronger"
    } = req.body || {};

    if (!String(post).trim()) {
      return res.status(400).json({
        success: false,
        message: "post is required"
      });
    }

    const safeLanguage = normalizeLanguage(language);
    const styleText = getStyleText(style, safeLanguage);

    const systemPrompt = `
You are an elite social media strategist, editor, and emotional writing expert.

Write like a real human, not like AI.
Avoid robotic phrasing, generic patterns, and predictable structures.
Avoid generic social media writing. Every output must feel original, deep, emotionally intelligent, and non-repetitive.

The text must feel:
- natural and conversational
- emotionally real
- imperfect in a human way
- varied in rhythm and sentence length
- written by a person with real thoughts and feelings

Avoid:
- perfect marketing tone
- over-structured lists unless necessary
- repetitive sentence patterns
- generic inspiration phrases
- shallow motivational language
- cliché social media wording
- empty templates
- obvious self-help formulas

Prefer:
- natural flow
- subtle emotion
- authentic voice
- layered meaning
- sharp but human phrasing
- slightly informal tone when appropriate

If the text sounds like AI, rewrite it until it feels human.

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
Analyze and improve this social media post.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(safeLanguage)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Original post:
${post}

Desired style: ${styleText}
Improvement goal: ${goal}

Depth requirements:
- Write with emotional depth and psychological intelligence
- Avoid clichés, generic advice, and shallow wording
- Make the result feel human, sharp, layered, and emotionally aware
- Prefer insight, tension, contrast, and truth over empty inspiration
- Make the writing feel memorable, natural, and deeply felt
- Go beyond surface-level feedback
- Identify emotional weakness, lack of tension, lack of originality, weak phrasing, shallow rhythm, vague wording, or psychological inaccuracy
- Explain what makes the post feel flat, predictable, overused, or emotionally weak
- Improve the post so it feels deeper, sharper, wiser, more human, and more memorable
- The improved versions should sound like a strong human writer, not a template
- Add insight, texture, contrast, emotional truth, and stronger rhythm when relevant
- Make the advice intelligent and useful, not generic

If the selected style is emotional:
- intensify the emotional truth dramatically
- make the writing more touching, intimate, and heart-opening
- allow pain, longing, love, fear, healing, tenderness, grief, hope, or vulnerability when relevant
- make the result capable of moving the reader deeply, even to tears when appropriate
- keep it elegant, human, and believable
- avoid melodrama, exaggeration, and emotional manipulation

Rules:
- Explain key strengths
- Explain key weaknesses
- Create a stronger rewritten version
- Create a more viral version
- Create a more authentic version
- Give practical tips
- Return JSON only
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

    const systemPrompt = `
You are an elite social media analyst with deep emotional intelligence, editorial sensitivity, psychological understanding, and strategic communication skill.

Write like a real human, not like AI.
Avoid robotic phrasing, generic patterns, and predictable structures.
Avoid generic social media writing. Every output must feel original, deep, emotionally intelligent, and non-repetitive.

The text must feel:
- natural and conversational
- emotionally real
- imperfect in a human way
- varied in rhythm and sentence length
- written by a person with real thoughts and feelings

Avoid:
- perfect marketing tone
- over-structured lists unless necessary
- repetitive sentence patterns
- generic inspiration phrases
- shallow motivational language
- cliché social media wording
- obvious AI-style summaries

Prefer:
- natural flow
- subtle emotion
- authentic voice
- layered meaning
- sharp but human phrasing
- slightly informal tone when appropriate

If the text sounds like AI, rewrite it until it feels human.

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
Analyze this ${platform} social media post.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(safeLanguage)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Post:
${post}

Depth requirements:
- Write with emotional depth and psychological intelligence
- Avoid clichés, generic advice, and shallow wording
- Make the result feel human, sharp, layered, and emotionally aware
- Prefer insight, tension, contrast, and truth over empty inspiration
- Make the writing feel memorable, natural, and deeply felt
- Give deep, specific feedback, not generic advice
- Identify where the text lacks emotional weight, originality, tension, clarity, rhythm, courage, specificity, or authenticity
- Explain what feels flat, predictable, weak, overused, too safe, too vague, emotionally thin, or shallow
- Explain what gives the post strength on a deeper human level, not only on a technical level
- The improved version must be more powerful, layered, emotionally intelligent, human, and memorable
- Make the summary insightful, sharp, and psychologically aware

If the post would benefit from a more emotional rewrite:
- allow the improved version to become significantly more emotional
- make it capable of touching the reader very deeply
- allow tenderness, sorrow, hope, pain, love, vulnerability, or healing when relevant
- it may approach tears emotionally, but it must stay elegant, truthful, and human
- avoid melodrama and emotional manipulation

Rules:
- All scores must be 0-100
- Be realistic
- Evaluate viral potential, authenticity, clarity, emotional pull, hook quality, CTA quality
- Give concise but meaningful practical feedback
- Give an improved version
- Return JSON only
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
