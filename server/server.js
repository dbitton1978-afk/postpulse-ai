import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------- SAFE PARSER ---------- */
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return {};
  }
}

/* ---------- GENERATE ---------- */
app.post("/generate-post", async (req, res) => {
  try {
    const { topic, targetAudience, goal, style, platform } = req.body;

    const prompt = `
You are an elite viral content strategist.

Create a HIGH QUALITY post:
- human tone
- strong hook
- no AI feel
- platform optimized

Topic: ${topic}
Audience: ${targetAudience}
Goal: ${goal}
Style: ${style}
Platform: ${platform}

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
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const text = response.choices[0].message.content;
    const data = safeJsonParse(text);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Generate failed" });
  }
});

/* ---------- IMPROVE ---------- */
app.post("/improve-post", async (req, res) => {
  try {
    const { post, goal, style, platform } = req.body;

    const prompt = `
Improve this post:

${post}

Goal: ${goal}
Style: ${style}
Platform: ${platform}

Make it:
- more human
- sharper
- engaging

Return JSON:
{
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "strengths": [],
  "weaknesses": [],
  "tips": []
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const text = response.choices[0].message.content;
    const data = safeJsonParse(text);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Improve failed" });
  }
});

/* ---------- ANALYZE ---------- */
app.post("/analyze-post", async (req, res) => {
  try {
    const { post, platform } = req.body;

    const prompt = `
Analyze this post deeply:

${post}

Platform: ${platform}

Return JSON:
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

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const text = response.choices[0].message.content;
    const data = safeJsonParse(text);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Analyze failed" });
  }
});

/* ---------- HEALTH ---------- */
app.get("/", (req, res) => {
  res.send("PostPulse API Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
