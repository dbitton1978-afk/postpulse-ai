import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "./models/User.js";
import Post from "./models/Post.js";
import auth from "./middleware/auth.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

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

app.use(cors({ origin: true }));
app.use(express.json({ limit: "15mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function cleanString(v) {
  return typeof v === "string" ? v.trim() : "";
}

function safeJsonParse(v, fallback = {}) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function normalizeLanguage(l) {
  return l === "he" ? "he" : "en";
}

function getLangLabel(l) {
  return normalizeLanguage(l) === "he" ? "Hebrew" : "English";
}

function normalizePlatform(p) {
  const allowed = ["instagram", "facebook", "linkedin", "tiktok"];
  return allowed.includes(p) ? p : "instagram";
}

function normalizeStyle(s) {
  const allowed = [
    "kabbalist",
    "mentor",
    "humorous",
    "spiritual",
    "emotional",
    "professional"
  ];
  return allowed.includes(s) ? s : "professional";
}

function normalizeHashtags(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((t) => "#" + String(t || "").replace("#", "").trim())
    .filter(Boolean);
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
  } catch {
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
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= HEALTH ================= */

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
          content: "You are a top social media expert. Return JSON only."
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
"title":"",
"hook":"",
"body":"",
"cta":"",
"hashtags":[],
"shortVersion":"",
"alternativeVersion":""
}
`
        }
      ]
    });

    const raw = completion.choices[0].message.content;
    const parsed = safeJsonParse(raw, {});
    parsed.hashtags = normalizeHashtags(parsed.hashtags);

    res.json({ success: true, data: parsed });
  } catch {
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
          content: "Improve post. Return JSON."
        },
        {
          role: "user",
          content: `
Post: ${post}
Goal: ${goal || "Improve the post"}
Style: ${style}
Platform: ${platform}
Language: ${getLangLabel(language)}

{
"improvedPost":"",
"moreViralVersion":"",
"moreAuthenticVersion":"",
"strengths":[],
"weaknesses":[],
"tips":[]
}
`
        }
      ]
    });

    const raw = completion.choices[0].message.content;
    const parsed = safeJsonParse(raw, {});

    res.json({ success: true, data: parsed });
  } catch {
    res.status(500).json({ error: "Improve failed" });
  }
});

/* ================= ANALYZE ================= */

app.post("/analyze-post", async (req, res) => {
  try {
    const post = cleanString(req.body.post);
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
          content: "Analyze post. Return JSON."
        },
        {
          role: "user",
          content: `
Post: ${post}
Language: ${getLangLabel(language)}

{
"viralScore":0,
"authenticityScore":0,
"clarityScore":0,
"emotionalScore":0,
"curiosityScore":0,
"hookScore":0,
"ctaScore":0,
"summary":"",
"whatWorks":[],
"whatHurts":[],
"improvements":[],
"improvedVersion":""
}
`
        }
      ]
    });

    const raw = completion.choices[0].message.content;
    const parsed = safeJsonParse(raw, {});

    res.json({ success: true, data: parsed });
  } catch {
    res.status(500).json({ error: "Analyze failed" });
  }
});

/* ================= HISTORY ================= */

app.post("/api/posts/save", auth, async (req, res) => {
  try {
    const type = cleanString(req.body.type);

    if (!["build", "improve", "analyze"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const post = await Post.create({
      user: req.user.id,
      type,
      language: normalizeLanguage(req.body.language),
      input: req.body.input || {},
      data: req.body.data || {}
    });

    res.json({ success: true, post });
  } catch {
    res.status(500).json({ message: "Save failed" });
  }
});

app.get("/api/posts/my-posts", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, posts });
  } catch {
    res.status(500).json({ message: "Load history failed" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
