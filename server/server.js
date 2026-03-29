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

async function saveGeneratedContent(userId, type, content) {
  try {
    await Post.create({
      userId,
      type,
      content
    });
  } catch (err) {
    console.error("saveGeneratedContent error:", err.message);
  }
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

/* Auth */
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

/* Posts storage */
app.post("/api/posts/save", authMiddleware, async (req, res) => {
  try {
    const type = cleanString(req.body?.type, "build");
    const content = req.body?.content ?? req.body;

    const post = await Post.create({
      userId: req.user.userId,
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
    const posts = await Post.find({ userId: req.user.userId })
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

/* Generate */
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

You ALWAYS:
- think before writing
- build a strategic internal brief
- write like a real human
- optimize for engagement and platform behavior

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

    if (req.user?.userId) {
      await saveGeneratedContent(req.user.userId, "build", normalized);
    }

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

/* Improve */
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

You do NOT rewrite blindly.

You first understand:
- what is weak
- what should stay
- what should become stronger
- what fits the user's goal
- what fits the platform

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
    const parsed = safeJsonParse(raw, buildImproveFallback({ post }));
    const normalized = normalizeImproveData(parsed);

    if (req.user?.userId) {
      await saveGeneratedContent(req.user.userId, "improve", normalized);
    }

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

/* Analyze */
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
- be practical, specific, and concise
- scores must be realistic
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
    const normalized = normalizeAnalyzeData(parsed);

    if (req.user?.userId) {
      await saveGeneratedContent(req.user.userId, "analyze", normalized);
    }

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

/* Backward-compatible routes */
app.post("/generate-post", handleGenerate);
app.post("/improve-post", handleImprove);
app.post("/analyze-post", handleAnalyze);

/* New API routes */
app.post("/api/generate-post", handleGenerate);
app.post("/api/improve-post", handleImprove);
app.post("/api/analyze-post", handleAnalyze);

/* Optional authenticated aliases that auto-save */
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
