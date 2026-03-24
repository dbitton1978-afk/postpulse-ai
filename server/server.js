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

function truncateText(value, maxLength = 1200) {
  const text = cleanString(value);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function normalizeHashtagsByPlatform(hashtags, platform) {
  const safePlatform = normalizePlatform(platform);
  const normalized = cleanArray(hashtags).map((tag) =>
    tag.startsWith("#") ? tag : `#${tag.replace(/^#+/, "")}`
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

function validateGeneratePayload(body = {}) {
  return {
    topic: truncateText(body?.topic, 500),
    targetAudience: truncateText(body?.targetAudience, 300),
    goal: truncateText(body?.goal, 300),
    language: normalizeLanguage(body?.language),
    style: body?.style || "professional",
    platform: normalizePlatform(body?.platform)
  };
}

function hasEnoughGeneratedContent(data) {
  if (!data) return false;

  const title = cleanString(data?.title);
  const hook = cleanString(data?.hook);
  const body = cleanString(data?.body);
  const cta = cleanString(data?.cta);

  return Boolean(hook && body && cta && (title || body.length > 30));
}

function fillGenerateFallbacks(data, { topic, platform, language }) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const normalized = normalizeGenerateResponse(data || {}, safePlatform);

  const fallbackTitle =
    safeLanguage === "he" ? `פוסט על ${topic}` : `Post about ${topic}`;

  const fallbackHook =
    safeLanguage === "he"
      ? `יש רגעים שבהם שינוי קטן בדרך שבה אנחנו מסתכלים על ${topic} משנה הכול.`
      : `Sometimes a small shift in how we look at ${topic} changes everything.`;

  const fallbackBody =
    safeLanguage === "he"
      ? `כשמדברים על ${topic}, רוב האנשים נשארים ברמה הכללית. אבל כדי לבלוט באמת צריך להביא זווית ברורה, מסר חד ותחושה אנושית שמתחברת לקוראים. כאן בדיוק מתחיל ההבדל בין עוד פוסט רגיל לבין פוסט שאנשים באמת עוצרים עליו.`
      : `When people talk about ${topic}, most stay generic. But standing out requires a clear angle, a sharp message, and a human tone that people can actually connect with. That is the difference between an ordinary post and one that genuinely makes people stop and read.`;

  const fallbackCta =
    safeLanguage === "he"
      ? safePlatform === "linkedin"
        ? "מה דעתכם על זה?"
        : "אם זה דיבר אליכם, כתבו לי בתגובות."
      : safePlatform === "linkedin"
        ? "What is your take on this?"
        : "If this resonated, share your thoughts in the comments.";

  const fallbackShort =
    safeLanguage === "he"
      ? `מבט חד יותר על ${topic} יכול לשנות את כל הדרך שבה אנשים מגיבים אליו.`
      : `A sharper angle on ${topic} can completely change how people respond to it.`;

  const fallbackAlternative =
    safeLanguage === "he"
      ? `לפעמים לא צריך לכתוב יותר על ${topic} — צריך לכתוב נכון יותר.`
      : `Sometimes the answer is not writing more about ${topic} — it is writing about it better.`;

  return {
    title: normalized.title || fallbackTitle,
    hook: normalized.hook || fallbackHook,
    body: normalized.body || fallbackBody,
    cta: normalized.cta || fallbackCta,
    hashtags: normalized.hashtags,
    shortVersion: normalized.shortVersion || fallbackShort,
    alternativeVersion: normalized.alternativeVersion || fallbackAlternative
  };
}

async function askAI(systemPrompt, userPrompt, maxCompletionTokens = 700) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    max_completion_tokens: maxCompletionTokens,
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

async function askAIJson(systemPrompt, userPrompt, maxCompletionTokens = 700) {
  const raw = await askAI(systemPrompt, userPrompt, maxCompletionTokens);
  return safeJsonParse(raw);
}

function validateApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * -----------------------------
 * INTERNAL ENGINES
 * -----------------------------
 */

async function buildGenerateBrief({
  topic,
  targetAudience,
  goal,
  platform,
  language,
  style
}) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const styleText = getStyleText(style, safeLanguage);
  const platformRules = getPlatformRules(safePlatform, safeLanguage);

  const systemPrompt = `
You are a senior content strategist.
Build a concise but smart internal brief before writing.
Focus on strategic clarity, emotional direction, and platform fit.
Avoid vague ideas and generic wording.

Required JSON structure:
{
  "postType": "",
  "angle": "",
  "coreEmotion": "",
  "primaryPromise": "",
  "hookDirection": "",
  "ctaDirection": "",
  "toneNotes": [],
  "keywordsToUse": [],
  "risksToAvoid": []
}
`;

  const userPrompt = `
Create a sharp internal brief for a social media post.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}
Topic: ${topic}
Target audience: ${targetAudience || "general audience"}
Goal: ${goal || "create a strong post"}
Style: ${styleText}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Length: ${platformRules.length}

Rules:
- choose the strongest post type for this case
- define one strong angle, not 3 weak ones
- define the core emotion that should lead the reader
- define one clear promise/value for the audience
- define the hook direction
- define the CTA direction
- add 3-6 tone notes
- add 3-6 keywords/phrases the writer should naturally use
- add 3-6 risks to avoid
- keep it concise but practical
`;

  const parsed = await askAIJson(systemPrompt, userPrompt, 450);

  return {
    postType: cleanString(parsed?.postType, "authority"),
    angle: cleanString(parsed?.angle, topic),
    coreEmotion: cleanString(parsed?.coreEmotion, "interest"),
    primaryPromise: cleanString(parsed?.primaryPromise, "clear value"),
    hookDirection: cleanString(parsed?.hookDirection, "clear and strong"),
    ctaDirection: cleanString(parsed?.ctaDirection, "natural and relevant"),
    toneNotes: cleanArray(parsed?.toneNotes),
    keywordsToUse: cleanArray(parsed?.keywordsToUse),
    risksToAvoid: cleanArray(parsed?.risksToAvoid)
  };
}

async function writeGeneratedPost({
  topic,
  targetAudience,
  goal,
  platform,
  language,
  style,
  brief
}) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const styleText = getStyleText(style, safeLanguage);
  const platformRules = getPlatformRules(safePlatform, safeLanguage);

  const systemPrompt = `
You are an elite social media writer.
You write like a real human, not like AI.
You must be platform-native, clear, sharp, emotional when needed, and never generic.
The post must feel publishable.

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
Target audience: ${targetAudience || "general audience"}
Goal: ${goal || "create a strong post"}
Style: ${styleText}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Hashtags: ${platformRules.hashtags}
- Length: ${platformRules.length}

Internal brief:
- Post type: ${brief.postType}
- Angle: ${brief.angle}
- Core emotion: ${brief.coreEmotion}
- Primary promise: ${brief.primaryPromise}
- Hook direction: ${brief.hookDirection}
- CTA direction: ${brief.ctaDirection}
- Tone notes: ${brief.toneNotes.join(", ")}
- Keywords to use naturally: ${brief.keywordsToUse.join(", ")}
- Risks to avoid: ${brief.risksToAvoid.join(", ")}

Writing rules:
- everything must be in ${getLanguageLabel(safeLanguage)}
- title should be useful and clean, not clickbait
- hook must make people want to continue reading
- body must deliver real value, not filler
- CTA must feel natural and platform-appropriate
- avoid robotic phrasing
- avoid repeating the same idea twice
- avoid generic motivational fluff
- shortVersion must be genuinely shorter, not a copy
- alternativeVersion must use a different phrasing angle
- hashtags must be relevant and natural
`;

  return askAIJson(systemPrompt, userPrompt, 900);
}

async function critiqueGeneratedPost({ platform, language, draft, brief }) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);

  const systemPrompt = `
You are a senior content critic.
Your job is to upgrade a generated post without changing its JSON structure.
Keep what is strong. Improve only what is weak.
Focus on hook strength, body sharpness, clarity, human tone, and platform fit.

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
Review this generated post and improve it where needed.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}

Internal brief for quality control:
- Angle: ${brief?.angle || ""}
- Core emotion: ${brief?.coreEmotion || ""}
- Primary promise: ${brief?.primaryPromise || ""}
- Hook direction: ${brief?.hookDirection || ""}
- CTA direction: ${brief?.ctaDirection || ""}

Improve if:
- the hook is too generic
- the body is too broad or sounds like AI
- the CTA is flat or forced
- the wording lacks emotional pull
- the post is not sharp enough for the platform
- shortVersion is too similar to the main version
- alternativeVersion is not meaningfully different

Current draft:
${JSON.stringify(draft)}
`;

  return askAIJson(systemPrompt, userPrompt, 900);
}

async function generatePostWithQualityLoop({
  topic,
  targetAudience,
  goal,
  platform,
  language,
  style
}) {
  const brief = await buildGenerateBrief({
    topic,
    targetAudience,
    goal,
    platform,
    language,
    style
  });

  const firstDraft = await writeGeneratedPost({
    topic,
    targetAudience,
    goal,
    platform,
    language,
    style,
    brief
  });

  if (!firstDraft || !hasEnoughGeneratedContent(firstDraft)) {
    return {
      brief,
      finalDraft: fillGenerateFallbacks(firstDraft, {
        topic,
        platform,
        language
      })
    };
  }

  const criticDraft = await critiqueGeneratedPost({
    platform,
    language,
    draft: firstDraft,
    brief
  });

  const selectedDraft =
    criticDraft && hasEnoughGeneratedContent(criticDraft) ? criticDraft : firstDraft;

  const finalDraft = fillGenerateFallbacks(selectedDraft, {
    topic,
    platform,
    language
  });

  return {
    brief,
    finalDraft
  };
}

/**
 * -----------------------------
 * ROUTES
 * -----------------------------
 */

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
      topic,
      targetAudience,
      goal,
      language,
      style,
      platform
    } = validateGeneratePayload(req.body || {});

    if (!String(topic).trim()) {
      return res.status(400).json({
        success: false,
        message: "topic is required"
      });
    }

    const { finalDraft } = await generatePostWithQualityLoop({
      topic,
      targetAudience,
      goal,
      platform,
      language,
      style
    });

    const normalized = normalizeGenerateResponse(finalDraft, platform);

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

    const parsed = await askAIJson(systemPrompt, userPrompt, 700);

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

    const parsed = await askAIJson(systemPrompt, userPrompt, 700);

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
