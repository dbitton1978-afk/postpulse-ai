import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

async function askAIWithImage(systemPrompt, userPrompt, imageData) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: imageData
            }
          }
        ]
      }
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

When the selected style is emotional, you should write with extraordinary emotional depth.
The text may become heartbreaking, soul-touching, tender, raw, intimate, and tear-inducing when appropriate.
But it must still feel real, elegant, and emotionally truthful — never manipulative, cheesy, or melodramatic.

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
Your job is to identify the real issue underneath the wording.

When the selected style is emotional, your rewrite should go even deeper emotionally.
It may become intimate, fragile, piercing, healing, heartbreaking, or deeply moving when appropriate.
But it must never become cheap, manipulative, overdramatic, or fake.

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

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("analyze-post error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze post"
    });
  }
});

app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageData = "", language = "en" } = req.body;

    if (!imageData || !imageData.startsWith("data:image")) {
      return res.status(400).json({
        success: false,
        message: "Valid imageData is required"
      });
    }

    const systemPrompt = `
You are an elite visual content analyst for social media.
You analyze images with high emotional intelligence, visual sensitivity, branding awareness, and storytelling skill.

Always return valid JSON only.

Required JSON structure:
{
  "summary": "",
  "mainSubjects": [],
  "visualMood": "",
  "emotionalTone": "",
  "visualStrengths": [],
  "visualWeaknesses": [],
  "contentAngles": [],
  "audienceFit": "",
  "storyPotential": "",
  "bestPostDirection": "",
  "suggestedStyle": ""
}
`;

    const userPrompt = `
Analyze this image for social media content strategy.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(language)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Depth requirements:
- Analyze the image deeply, not superficially
- Identify emotional tone, visual energy, mood, and story potential
- Explain what kind of post can come out of this image
- Detect human emotion, atmosphere, symbolism, contrast, and visual message when relevant
- Suggest the strongest content direction for social media
- Be insightful, emotionally intelligent, and specific

Rules:
- Return JSON only
`;

    const raw = await askAIWithImage(systemPrompt, userPrompt, imageData);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse image analysis"
      });
    }

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("analyze-image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze image"
    });
  }
});

app.post("/api/generate-post-from-image-analysis", async (req, res) => {
  try {
    const {
      analysis,
      language = "en",
      style = "professional",
      goal = "",
      platform = "instagram",
      targetAudience = ""
    } = req.body;

    if (!analysis || typeof analysis !== "object") {
      return res.status(400).json({
        success: false,
        message: "analysis object is required"
      });
    }

    const styleText =
      STYLE_MAP[style]?.[language] || STYLE_MAP.professional[language];

    const systemPrompt = `
You are an elite social media writer who turns image analysis into a powerful post.
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
Create a strong ${platform} social media post based on this image analysis.

IMPORTANT:
- You MUST respond ONLY in ${getLanguageLabel(language)}
- DO NOT use any other language
- If Hebrew is selected -> everything must be in Hebrew
- If English is selected -> everything must be in English

Target audience: ${targetAudience}
Goal: ${goal}
Style: ${styleText}

Image analysis:
${JSON.stringify(analysis, null, 2)}

Depth requirements:
- Use the image analysis as the emotional and strategic core of the post
- Make the post feel human, intelligent, and visually grounded
- Reflect the mood, energy, and story potential of the image
- Avoid generic caption language
- Build a post that feels connected to what is actually seen and felt in the image
- Strong hook, meaningful body, natural CTA

If the selected style is emotional:
- go very deep emotionally when appropriate
- allow tenderness, vulnerability, grief, hope, love, longing, healing, or human truth
- make it touching but never fake or melodramatic

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
        message: "Failed to parse generated post"
      });
    }

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("generate-post-from-image-analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate post from image analysis"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
