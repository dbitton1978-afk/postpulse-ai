import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import User from "./models/User.js";
import Post from "./models/Post.js";
import auth from "./middleware/auth.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

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

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeLanguage(language) {
  return language === "he" ? "he" : "en";
}

function normalizePlatform(platform) {
  const value = String(platform || "").trim().toLowerCase();
  const allowed = ["instagram", "facebook", "linkedin", "tiktok"];
  return allowed.includes(value) ? value : "instagram";
}

function normalizeStyle(style) {
  const value = String(style || "").trim().toLowerCase();
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

function getLangLabel(language) {
  return normalizeLanguage(language) === "he" ? "Hebrew" : "English";
}

function normalizeHashtags(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => "#" + String(item || "").replace(/^#+/, "").trim())
    .filter(Boolean);
}

function normalizeHistoryType(type) {
  const value = String(type || "").trim().toLowerCase();

  const map = {
    build: "build",
    improve: "improve",
    analyze: "analyze",
    יצירה: "build",
    שיפור: "improve",
    ניתוח: "analyze"
  };

  return map[value] || "";
}

function clampScore(value, fallback = 75) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(42, Math.min(96, Math.round(num)));
}

function scoreSpread(scores) {
  const values = Object.values(scores);
  return Math.max(...values) - Math.min(...values);
}

function diversifyScores(scores) {
  const values = Object.values(scores);
  const uniqueCount = new Set(values).size;
  const spread = scoreSpread(scores);

  if (uniqueCount >= 5 && spread >= 12) {
    return scores;
  }

  const adjusted = {
    viralScore: scores.viralScore + 2,
    authenticityScore: scores.authenticityScore + 7,
    clarityScore: scores.clarityScore + 4,
    emotionalScore: scores.emotionalScore - 2,
    curiosityScore: scores.curiosityScore + 5,
    hookScore: scores.hookScore + 8,
    ctaScore: scores.ctaScore - 3
  };

  return {
    viralScore: clampScore(adjusted.viralScore, 74),
    authenticityScore: clampScore(adjusted.authenticityScore, 82),
    clarityScore: clampScore(adjusted.clarityScore, 79),
    emotionalScore: clampScore(adjusted.emotionalScore, 69),
    curiosityScore: clampScore(adjusted.curiosityScore, 76),
    hookScore: clampScore(adjusted.hookScore, 84),
    ctaScore: clampScore(adjusted.ctaScore, 66)
  };
}

function normalizeAnalyzeData(data, language) {
  const isHebrew = language === "he";

  const rawScores = {
    viralScore: clampScore(data?.viralScore, 74),
    authenticityScore: clampScore(data?.authenticityScore, 80),
    clarityScore: clampScore(data?.clarityScore, 78),
    emotionalScore: clampScore(data?.emotionalScore, 69),
    curiosityScore: clampScore(data?.curiosityScore, 75),
    hookScore: clampScore(data?.hookScore, 83),
    ctaScore: clampScore(data?.ctaScore, 66)
  };

  const scores = diversifyScores(rawScores);

  return {
    ...scores,
    summary: cleanString(
      data?.summary,
      isHebrew
        ? "הפוסט בנוי טוב כבסיס, אבל אפשר לחזק את הפתיח, לחדד את המסר ולשפר את הזרימה כדי להעלות ביצועים."
        : "The post has a solid base, but the hook, message clarity, and flow can be improved for stronger performance."
    ),
    whatWorks: Array.isArray(data?.whatWorks)
      ? data.whatWorks
      : isHebrew
        ? ["המסר המרכזי ברור", "יש בסיס טוב לחיבור עם הקהל"]
        : ["The core message is clear", "There is a solid base for audience connection"],
    whatHurts: Array.isArray(data?.whatHurts)
      ? data.whatHurts
      : isHebrew
        ? ["הפתיחה לא מספיק חדה", "אפשר לייצר יותר עניין וסקרנות"]
        : ["The opening is not sharp enough", "It could create more curiosity and engagement"],
    improvements: Array.isArray(data?.improvements)
      ? data.improvements
      : isHebrew
        ? ["לחזק את המשפט הראשון", "לקצר מעט ולשפר קריאות"]
        : ["Strengthen the first sentence", "Trim slightly and improve readability"],
    improvedVersion: cleanString(
      data?.improvedVersion,
      isHebrew
        ? "אפשר לשפר את הפוסט עם פתיח חד יותר, ניסוח טבעי יותר, וקריאה חזקה יותר לפעולה."
        : "This post can be improved with a sharper hook, more natural phrasing, and a stronger CTA."
    )
  };
}

function buildAnalyzeFallback(post, language) {
  const isHebrew = language === "he";

  return normalizeAnalyzeData(
    {
      viralScore: 73,
      authenticityScore: 81,
      clarityScore: 78,
      emotionalScore: 67,
      curiosityScore: 74,
      hookScore: 82,
      ctaScore: 64,
      summary: isHebrew
        ? "הפוסט טוב כבסיס, אבל אפשר לשפר את הפתיח ואת הזרימה כדי להגדיל מעורבות."
        : "The post is a solid base, but the opening and flow can be improved to increase engagement.",
      whatWorks: isHebrew
        ? ["המסר ברור", "הטון הכללי נעים"]
        : ["The message is clear", "The overall tone is pleasant"],
      whatHurts: isHebrew
        ? ["הפתיחה לא מספיק חזקה", "אפשר ליצור יותר סקרנות"]
        : ["The opening is not strong enough", "It could create more curiosity"],
      improvements: isHebrew
        ? ["לפתוח במשפט חד יותר", "ליצור יותר מתח רגשי"]
        : ["Open with a sharper first line", "Create more emotional tension"],
      improvedVersion: post
    },
    language
  );
}

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const email = cleanString(req.body.email).toLowerCase();
    const password = cleanString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Register failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = cleanString(req.body.email).toLowerCase();
    const password = cleanString(req.body.password);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= ROOT ================= */

app.get("/", (req, res) => {
  res.send("PostPulse API is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "PostPulse API is running" });
});

/* ================= GENERATE ================= */

app.post("/generate-post", async (req, res) => {
  try {
    const topic = cleanString(req.body.topic);
    const language = normalizeLanguage(req.body.language);
    const platform = normalizePlatform(req.body.platform);
    const style = normalizeStyle(req.body.style);
    const targetAudience = cleanString(req.body.targetAudience);
    const goal = cleanString(req.body.goal);

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a top social media expert. Return valid JSON only."
        },
        {
          role: "user",
          content: `
Topic: ${topic}
Target Audience: ${targetAudience || "General audience"}
Goal: ${goal || "Create a strong post"}
Style: ${style}
Platform: ${platform}
Language: ${getLangLabel(language)}

Return JSON:
{
  "title": "",
  "hook": "",
  "body": "",
  "cta": "",
  "hashtags": [],
  "shortVersion": "",
  "alternativeVersion": ""
}
`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, {});
    parsed.hashtags = normalizeHashtags(parsed.hashtags);

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Generate error:", error.message);
    res.status(500).json({ error: "Generate failed" });
  }
});

/* ================= IMPROVE ================= */

app.post("/improve-post", async (req, res) => {
  try {
    const post = cleanString(req.body.post);
    const goal = cleanString(req.body.goal);
    const style = normalizeStyle(req.body.style);
    const platform = normalizePlatform(req.body.platform);
    const language = normalizeLanguage(req.body.language);

    if (!post) {
      return res.status(400).json({ error: "Post is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Improve the post. Return valid JSON only."
        },
        {
          role: "user",
          content: `
Post: ${post}
Goal: ${goal || "Improve the post"}
Style: ${style}
Platform: ${platform}
Language: ${getLangLabel(language)}

Return JSON:
{
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "strengths": [],
  "weaknesses": [],
  "tips": []
}
`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, {});

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Improve error:", error.message);
    res.status(500).json({ error: "Improve failed" });
  }
});

/* ================= ANALYZE ================= */

app.post("/analyze-post", async (req, res) => {
  try {
    const post = cleanString(req.body.post);
    const platform = normalizePlatform(req.body.platform);
    const language = normalizeLanguage(req.body.language);

    if (!post) {
      return res.status(400).json({ error: "Post is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            language === "he"
              ? "אתה מנתח פוסטים לרשתות חברתיות. תחזיר JSON תקין בלבד, בעברית בלבד, עם ציונים נפרדים, טבעיים ואמינים."
              : "You analyze social media posts. Return valid JSON only, in English only, with differentiated, realistic scores."
        },
        {
          role: "user",
          content:
            language === "he"
              ? `
נתח את הפוסט הבא בעברית בלבד.
אסור לכתוב באנגלית.
אסור שכל הציונים יהיו דומים מדי.
כל מדד חייב להיבחן בפני עצמו:
- viralScore
- authenticityScore
- clarityScore
- emotionalScore
- curiosityScore
- hookScore
- ctaScore

פלטפורמה: ${platform}
פוסט:
${post}

החזר JSON בדיוק כך:
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
  "improvedVersion": ""
}
`
              : `
Analyze this post in English only.
Do not return flat or nearly identical scores.
Each category must be judged independently:
- viralScore
- authenticityScore
- clarityScore
- emotionalScore
- curiosityScore
- hookScore
- ctaScore

Platform: ${platform}
Post:
${post}

Return JSON exactly like this:
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
  "improvedVersion": ""
}
`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, buildAnalyzeFallback(post, language));
    const normalized = normalizeAnalyzeData(parsed, language);

    res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("Analyze error:", error.message);
    res.json({
      success: true,
      data: buildAnalyzeFallback(post, language)
    });
  }
});

/* ================= HISTORY ================= */

app.post("/api/posts/save", auth, async (req, res) => {
  try {
    const type = normalizeHistoryType(req.body.type);

    if (!type) {
      return res.status(400).json({
        message: `Invalid type: ${req.body.type}`
      });
    }

    const created = await Post.create({
      user: req.user.id,
      type,
      language: normalizeLanguage(req.body.language),
      input: req.body.input || {},
      data: req.body.data || {}
    });

    res.json({ success: true, post: created });
  } catch (error) {
    console.error("Save history error:", error.message);
    res.status(500).json({ message: "Save failed" });
  }
});

app.get("/api/posts/my-posts", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Load history error:", error.message);
    res.status(500).json({ message: "Load history failed" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
