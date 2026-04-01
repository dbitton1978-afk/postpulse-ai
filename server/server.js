import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { authMiddleware } from "./middleware/auth.js";

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

function normalizeScoreValue(value) {
  const num = Number(value);

  if (!Number.isFinite(num)) return 0;

  if (num >= 0 && num <= 10) {
    return Math.round(num * 10);
  }

  return Math.round(num);
}

function clampScore(value) {
  const normalized = normalizeScoreValue(value);
  return Math.max(0, Math.min(100, normalized));
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

function normalizeGenerateData(data, meta = {}) {
  return {
    language: normalizeLanguage(meta.language),
    platform: normalizePlatform(meta.platform),
    style: normalizeStyle(meta.style),
    goal: cleanString(meta.goal),
    title: cleanString(data?.title),
    hook: cleanString(data?.hook),
    body: cleanString(data?.body),
    cta: cleanString(data?.cta),
    hashtags: normalizeHashtags(data?.hashtags),
    shortVersion: cleanString(data?.shortVersion),
    alternativeVersion: cleanString(data?.alternativeVersion)
  };
}

function normalizeImproveData(data, meta = {}) {
  return {
    language: normalizeLanguage(meta.language),
    platform: normalizePlatform(meta.platform),
    style: normalizeStyle(meta.style),
    goal: cleanString(meta.goal),
    strengths: cleanArray(data?.strengths),
    weaknesses: cleanArray(data?.weaknesses),
    improvedPost: cleanString(data?.improvedPost),
    moreViralVersion: cleanString(data?.moreViralVersion),
    moreAuthenticVersion: cleanString(data?.moreAuthenticVersion),
    tips: cleanArray(data?.tips)
  };
}

function normalizeAnalyzeData(data, meta = {}) {
  return {
    language: normalizeLanguage(meta.language),
    platform: normalizePlatform(meta.platform),
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

function buildGenerateFallback({ topic, language, platform, style, goal }) {
  const isHebrew = normalizeLanguage(language) === "he";

  return {
    language: normalizeLanguage(language),
    platform: normalizePlatform(platform),
    style: normalizeStyle(style),
    goal: cleanString(goal),
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

function buildImproveFallback({ post, language, platform, style, goal }) {
  return {
    language: normalizeLanguage(language),
    platform: normalizePlatform(platform),
    style: normalizeStyle(style),
    goal: cleanString(goal),
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
    language: normalizeLanguage(language),
    platform: safePlatform,
    viralScore: 68,
    authenticityScore: 74,
    clarityScore: 76,
    emotionalScore: 66,
    curiosityScore: 67,
    hookScore: 64,
    ctaScore: 63,
    summary: isHebrew
      ? "יש כאן בסיס טוב, אבל אפשר לחזק פתיחה, סקרנות וקריאה לפעולה."
      : "There is a solid base here, but the opening, curiosity, and CTA can be stronger.",
    whatWorks: isHebrew
      ? ["הנושא ברור", "יש בסיס טוב למסר", "אפשר לבנות עליו חזק"]
      : ["The topic is clear", "There is a solid message base", "It has strong potential"],
    whatHurts: isHebrew
      ? ["הפתיחה לא מספיק חדה", "הטקסט יכול להיות אנושי יותר"]
      : ["The opening is not sharp enough", "The text could sound more human"],
    improvements: isHebrew
      ? ["לחזק את המשפט הראשון", "לחדד את הערך לקורא", "לשפר CTA"]
      : ["Strengthen the first sentence", "Clarify the reader value", "Improve the CTA"],
    raiseViralScore: isHebrew
      ? ["לפתוח עם מתח", "להכניס זווית מפתיעה"]
      : ["Open with tension", "Add a surprising angle"],
    raiseAuthenticityScore: isHebrew
      ? ["לפשט ניסוח", "לדבר בגובה העיניים"]
      : ["Simplify wording", "Use a more natural voice"],
    raiseEmotionalScore: isHebrew
      ? ["לגעת בכאב או רצון אמיתי"]
      : ["Touch a real pain point or desire"],
    raiseCuriosityScore: isHebrew
      ? ["להשאיר לולאה פתוחה", "לעורר שאלה כבר בפתיחה"]
      : ["Leave an open loop", "Trigger a question in the opening"],
    improvedVersion:
      cleanString(post) ||
      (isHebrew
        ? `אם רוצים שהפוסט יעבוד טוב יותר ב-${safePlatform}, צריך פתיחה חזקה יותר וניסוח ברור יותר.`
        : `If you want this post to work better on ${safePlatform}, it needs a stronger opening and clearer wording.`)
  };
}

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email
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

app.post("/api/auth/register", async (req, res) => {
  try {
    const email = cleanString(req.body?.email).toLowerCase();
    const password = cleanString(req.body?.password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword
    });

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error("register error:", err);

    return res.status(500).json({
      success: false,
      error: "Register failed"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = cleanString(req.body?.email).toLowerCase();
    const password = cleanString(req.body?.password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error("login error:", err);

    return res.status(500).json({
      success: false,
      error: "Login failed"
    });
  }
});

app.post("/api/posts/save", authMiddleware, async (req, res) => {
  try {
    const type = cleanString(req.body?.type, "build");
    const content = req.body?.content ?? {};

    if (!content || typeof content !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid content"
      });
    }

    const post = await Post.create({
      userId: String(req.user.userId),
      type: ["build", "improve", "analyze"].includes(type) ? type : "build",
      content
    });

    return res.json({
      success: true,
      post
    });
  } catch (err) {
    console.error("save post error:", err);

    return res.status(500).json({
      success: false,
      error: "Save post failed"
    });
  }
});

app.get("/api/posts/my-posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ userId: String(req.user.userId) })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      posts
    });
  } catch (err) {
    console.error("my-posts error:", err);

    return res.status(500).json({
      success: false,
      error: "Load history failed"
    });
  }
});

async function handleGenerate(req, res) {
  try {
    const topic = cleanString(req.body?.topic);
    const targetAudience = cleanString(req.body?.targetAudience);
    const goal = cleanString(req.body?.goal);
    const style = normalizeStyle(req.body?.style);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!topic) {
      return res.status(400).json({ success: false, error: "Topic is required" });
    }

    const systemPrompt = `
You are a world-class social media content strategist.
You NEVER generate generic AI text.
You ALWAYS write like a sharp, natural human creator.
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

Return JSON only:

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
    const parsed = safeJsonParse(
      raw,
      buildGenerateFallback({ topic, language, platform, style, goal })
    );
    const normalized = normalizeGenerateData(parsed, {
      language,
      platform,
      style,
      goal
    });

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
}

async function handleImprove(req, res) {
  try {
    const post = cleanString(req.body?.post);
    const goal = cleanString(req.body?.goal);
    const style = normalizeStyle(req.body?.style);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!post) {
      return res.status(400).json({ success: false, error: "Post is required" });
    }

    const systemPrompt = `
You are a world-class social media post optimizer.
You improve text in a natural, human, persuasive way.
Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Post: ${post}
Goal: ${goal || "Make it sharper, more human, and more effective"}
Style: ${style}
Platform: ${platform}
Language: ${getLanguageLabel(language)}

Return JSON only:

{
  "strengths": [],
  "weaknesses": [],
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "tips": []
}

RULES:
- keep the meaning unless improvement is necessary
- make the text feel more human
- avoid robotic AI tone
- improve hook, clarity, and emotional pull where needed
- adapt naturally to ${platform}
- platform guide: ${getPlatformGuide(platform, language)}
- write only in ${getLanguageLabel(language)}
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
    const parsed = safeJsonParse(
      raw,
      buildImproveFallback({ post, language, platform, style, goal })
    );
    const normalized = normalizeImproveData(parsed, {
      language,
      platform,
      style,
      goal
    });

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
}

async function handleAnalyze(req, res) {
  try {
    const post = cleanString(req.body?.post);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!post) {
      return res.status(400).json({ success: false, error: "Post is required" });
    }

    const systemPrompt = `
You are a world-class social media content analyst.

You analyze posts for:
- virality
- authenticity
- clarity
- emotional impact
- curiosity
- hook quality
- CTA strength

Return valid JSON only.
All scores must be on a 0-100 scale.
Do not use 0-10 scores.
Be realistic, but not harsh by default.
A decent post should usually land in the 60-85 range.
`;

    const userPrompt = `
INPUT:
Post: ${post}
Platform: ${platform}
Language: ${getLanguageLabel(language)}

Return JSON only:

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
- scores must be 0-100 only
- a decent post should not get single-digit results
- be practical, specific, and concise
- adapt to ${platform}
- platform guide: ${getPlatformGuide(platform, language)}
- write only in ${getLanguageLabel(language)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(
      raw,
      buildAnalyzeFallback({ post, language, platform })
    );
    const normalized = normalizeAnalyzeData(parsed, {
      language,
      platform
    });

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
}

app.post("/generate-post", handleGenerate);
app.post("/improve-post", handleImprove);
app.post("/analyze-post", handleAnalyze);

app.post("/api/generate-post", handleGenerate);
app.post("/api/improve-post", handleImprove);
app.post("/api/analyze-post", handleAnalyze);

app.post("/api/posts/generate", authMiddleware, handleGenerate);
app.post("/api/posts/improve", authMiddleware, handleImprove);
app.post("/api/posts/analyze", authMiddleware, handleAnalyze);

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`PostPulse AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server start error:", err);
  process.exit(1);
});
