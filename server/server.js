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
  professional: {
    he: "מקצועי, חכם, חד, סמכותי, נקי, מדויק, עמוק ולא גנרי",
    en: "professional, intelligent, sharp, authoritative, polished, precise and non-generic"
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
    temperature: 1.0,
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
You are an elite social media writer with exceptional emotional intelligence, psychological insight, human sensitivity, and stylistic maturity.
You do not write generic content.
You do not produce shallow motivational language.
You avoid clichés, filler, fake inspiration, empty hype, and repetitive social-media templates.

You write like a brilliant human strategist and storyteller:
- emotionally perceptive
- psychologically accurate
- sharp in phrasing
- layered in meaning
- authentic in tone
- memorable in rhythm
- capable of tension, contrast, vulnerability, precision, and insight

Your writing should feel:
- human, not robotic
- deep, not inflated
- intelligent, not overcomplicated
- emotionally true, not performative
- persuasive, but never fake

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

Depth requirements:
- Write with maximum emotional intelligence and human depth
- Avoid generic marketing language completely
- Avoid clichés, shallow phrases, fake empowerment, and obvious wording
- The writing should feel alive, sharp, layered, emotionally aware, and original
- Include insight, tension, contrast, emotional truth, or a meaningful observation when relevant
- The hook must stop scrolling because it feels real, intelligent, and emotionally charged
- The body must have texture, movement, and actual substance
- The CTA must feel natural, persuasive, and psychologically accurate, not forced
- Make the post feel like it was written by someone wise, observant, and deeply human
- Prefer depth over noise
- Prefer clarity with intelligence over complexity with emptiness

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
You are an elite social media strategist, editor, and emotional writing expert.
You specialize in diagnosing why a piece of writing feels flat, cliché, weak, forgettable, emotionally thin, or psychologically inaccurate.

You think like:
- a brilliant editor
- a human behavior expert
- a persuasive copy strategist
- a sensitive writer with emotional depth

Your job is not to give surface-level advice.
Your job is to identify the real issue underneath the wording:
- weak emotional center
- lack of tension
- no contrast
- generic language
- no originality
- fake inspiration
- unclear point
- poor rhythm
- shallow phrasing
- emotionally safe but forgettable writing

When you rewrite, the result must feel:
- sharper
- deeper
- more human
- more truthful
- more emotionally intelligent
- more memorable
- more alive

Avoid clichés, templates, hollow self-help language, and generic content formulas.

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

Depth requirements:
- Go beyond surface-level feedback
- Identify emotional weakness, lack of tension, lack of originality, weak phrasing, shallow rhythm, vague wording, or psychological inaccuracy
- Explain what makes the post feel flat, predictable, overused, or emotionally weak
- Improve the post so it feels deeper, sharper, wiser, more human, and more memorable
- Avoid cliché self-help language and overused social-media phrasing
- The improved versions should sound like a strong human writer, not a template
- Add insight, texture, contrast, emotional truth, and stronger rhythm when relevant
- Make the advice intelligent and useful, not generic
- The rewritten content should feel like it understands people, not just content

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
You are an elite social media analyst with deep emotional intelligence, editorial sensitivity, psychological understanding, and strategic communication skill.

You do not give generic feedback.
You do not say obvious things unless they are truly important.
You identify why writing works or fails at a deeper level:
- emotional weight
- authenticity
- specificity
- tension
- rhythm
- originality
- clarity
- psychological pull
- memorability
- persuasive structure

You can detect when a text is:
- flat
- predictable
- emotionally thin
- overexplained
- generic
- too safe
- too vague
- trying too hard
- missing contrast or human truth

Your feedback should feel like it comes from a brilliant editor who understands people, not just content metrics.

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

Depth requirements:
- Give deep, specific feedback, not generic advice
- Identify where the text lacks emotional weight, originality, tension, clarity, rhythm, courage, specificity, or authenticity
- Explain what feels flat, predictable, weak, overused, too safe, too vague, emotionally thin, or shallow
- Explain what gives the post strength on a deeper human level, not only on a technical level
- The improved version must be more powerful, layered, emotionally intelligent, human, and memorable
- Avoid cliché language in both feedback and rewrite
- Make the summary insightful, sharp, and psychologically aware
- Prefer truth over politeness when diagnosing weakness
- Prefer depth over standard social-media advice

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
