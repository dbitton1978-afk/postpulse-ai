import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const STYLE_MAP = {
  kabbalist: {
    he: "קבליסטי, עמוק, סודי, חכם, רוחני ומסתורי",
    en: "kabbalistic, deep, mystical, wise, spiritual and mysterious"
  },
  mentor: {
    he: "מנטורי, בטוח, מוביל, חד, מעצים ומכוון תוצאה",
    en: "mentor-like, confident, empowering, sharp and action-oriented"
  },
  humorous: {
    he: "הומוריסטי, קליל, שנון, מצחיק וחכם",
    en: "humorous, witty, light, clever and funny"
  },
  spiritual: {
    he: "רוחני, עמוק, רגשי, מחבר ומעורר השראה",
    en: "spiritual, deep, emotional, connective and inspiring"
  },
  professional: {
    he: "מקצועי, ברור, סמכותי, נקי ומדויק",
    en: "professional, clear, authoritative, polished and precise"
  }
};

function getLanguageLabel(language) {
  return language === "he" ? "Hebrew" : "English";
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function askAI(systemPrompt, userPrompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return response.choices[0]?.message?.content || "{}";
}

app.get("/", (req, res) => {
  res.send("PostPulse API is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "PostPulse API is running" });
});

app.post("/api/generate-post", async (req, res) => {
  try {
    const {
      topic = "",
      targetAudience = "",
      language = "en",
      style = "professional",
      goal = "",
      platform = "instagram"
    } = req.body;

    if (!topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "topic is required"
      });
    }

    const styleText =
      STYLE_MAP[style]?.[language] || STYLE_MAP.professional[language];

    const systemPrompt = `
You are an elite social media copywriter.
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
- You MUST respond ONLY in ${getLanguageLabel(language)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Topic: ${topic}
Target audience: ${targetAudience}
Goal: ${goal}
Style: ${styleText}

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

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("generate-post error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate post"
    });
  }
});

app.post("/api/improve-post", async (req, res) => {
  try {
    const {
      post = "",
      language = "en",
      style = "professional",
      goal = "make it stronger"
    } = req.body;

    if (!post.trim()) {
      return res.status(400).json({
        success: false,
        message: "post is required"
      });
    }

    const styleText =
      STYLE_MAP[style]?.[language] || STYLE_MAP.professional[language];

    const systemPrompt = `
You are an elite social media strategist.
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
- You MUST respond ONLY in ${getLanguageLabel(language)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Original post:
${post}

Desired style: ${styleText}
Improvement goal: ${goal}

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

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("improve-post error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to improve post"
    });
  }
});

app.post("/api/analyze-post", async (req, res) => {
  try {
    const { post = "", language = "en", platform = "instagram" } = req.body;

    if (!post.trim()) {
      return res.status(400).json({
        success: false,
        message: "post is required"
      });
    }

    const systemPrompt = `
You are an elite social media analyst.
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
- You MUST respond ONLY in ${getLanguageLabel(language)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Post:
${post}

Rules:
- All scores must be 0-100
- Be realistic
- Evaluate viral potential, authenticity, clarity, emotional pull, hook quality, CTA quality
- Give concise practical feedback
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

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("analyze-post error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze post"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
