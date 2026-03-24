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

function validateImprovePayload(body = {}) {
  return {
    post: truncateText(body?.post, 5000),
    language: normalizeLanguage(body?.language),
    style: body?.style || "professional",
    goal: truncateText(body?.goal, 300) || "make it stronger",
    platform: normalizePlatform(body?.platform)
  };
}

function validateAnalyzePayload(body = {}) {
  return {
    post: truncateText(body?.post, 5000),
    language: normalizeLanguage(body?.language),
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

function hasEnoughImprovedContent(data) {
  if (!data) return false;

  const improvedPost = cleanString(data?.improvedPost);
  const moreViralVersion = cleanString(data?.moreViralVersion);
  const moreAuthenticVersion = cleanString(data?.moreAuthenticVersion);

  return Boolean(improvedPost && (moreViralVersion || moreAuthenticVersion));
}

function hasEnoughAnalyzeContent(data) {
  if (!data) return false;

  const summary = cleanString(data?.summary);
  const improvedVersion = cleanString(data?.improvedVersion);
  const whatWorks = cleanArray(data?.whatWorks);
  const improvements = cleanArray(data?.improvements);

  return Boolean(summary && improvedVersion && whatWorks.length && improvements.length);
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

function fillImproveFallbacks(data, { post, goal, language, platform }) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const normalized = normalizeImproveResponse(data || {});
  const original = cleanString(post);

  const fallbackStrengths =
    safeLanguage === "he"
      ? ["יש כאן בסיס רעיוני טוב", "הנושא ברור", "יש פוטנציאל לחיבור עם הקהל"]
      : ["There is a solid core idea", "The topic is clear", "There is audience connection potential"];

  const fallbackWeaknesses =
    safeLanguage === "he"
      ? ["הניסוח עדיין מעט כללי", "הפתיחה לא מספיק חזקה", "אפשר לחזק את התחושה האנושית"]
      : ["The wording is still a bit generic", "The opening is not strong enough", "The human tone can be stronger"];

  const fallbackImproved =
    safeLanguage === "he"
      ? `${original}\n\nכדי להפוך את המסר לחזק יותר, צריך לחדד את הזווית, לדבר בצורה יותר אנושית וישירה, ולתת לקורא סיבה אמיתית להמשיך לקרוא ולהגיב.`
      : `${original}\n\nTo make this stronger, the message should be sharper, more human, and more direct, while giving the reader a real reason to keep reading and respond.`;

  const fallbackViral =
    safeLanguage === "he"
      ? safePlatform === "tiktok"
        ? `אם אתה עדיין כותב פוסטים בצורה הרגילה שלך — כנראה שאתה מפספס את מה שבאמת גורם לאנשים לעצור. הנה ההבדל שעושה שינוי.`
        : `רוב האנשים מפרסמים תוכן ואז מקווים לטוב. אבל כשמשנים רק כמה דברים קטנים בניסוח, כל התגובה של הקהל יכולה להשתנות.`
      : safePlatform === "tiktok"
        ? `If you are still posting the usual way, you are probably missing what actually makes people stop. Here is the shift that changes everything.`
        : `Most people publish content and hope for the best. But changing just a few things in the wording can completely change how people respond.`;

  const fallbackAuthentic =
    safeLanguage === "he"
      ? `האמת היא שלא תמיד צריך לכתוב יותר טוב — לפעמים פשוט צריך לכתוב יותר אמיתי, יותר ברור, ובלי לנסות להרשים בכוח.`
      : `The truth is, you do not always need to write better — sometimes you just need to sound more real, clearer, and less like you are trying too hard.`;

  const fallbackTips =
    safeLanguage === "he"
      ? [
          "לחזק את המשפט הראשון",
          "לדבר פשוט יותר",
          "לחדד את הערך לקורא",
          `ליישר את הניסוח למטרה: ${goal || "חיזוק הפוסט"}`
        ]
      : [
          "Strengthen the first line",
          "Use simpler wording",
          "Clarify the value for the reader",
          `Align the wording to the goal: ${goal || "make the post stronger"}`
        ];

  return {
    strengths: normalized.strengths.length ? normalized.strengths : fallbackStrengths,
    weaknesses: normalized.weaknesses.length ? normalized.weaknesses : fallbackWeaknesses,
    improvedPost: normalized.improvedPost || fallbackImproved,
    moreViralVersion: normalized.moreViralVersion || fallbackViral,
    moreAuthenticVersion: normalized.moreAuthenticVersion || fallbackAuthentic,
    tips: normalized.tips.length ? normalized.tips : fallbackTips
  };
}

function fillAnalyzeFallbacks(data, { post, language, platform }) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const normalized = normalizeAnalyzeResponse(data || {});
  const original = cleanString(post);

  const fallbackSummary =
    safeLanguage === "he"
      ? "הפוסט מעביר כיוון ברור, אבל עדיין אפשר לחזק את החדות, המשיכה והתחושה האנושית שלו."
      : "The post has a clear direction, but it can still be sharper, more engaging, and more human.";

  const fallbackWhatWorks =
    safeLanguage === "he"
      ? ["הנושא מובן", "יש בסיס למסרים ברורים", "אפשר לבנות עליו גרסה חזקה יותר"]
      : ["The topic is understandable", "There is a base for a clear message", "It can be developed into a stronger version"];

  const fallbackWhatHurts =
    safeLanguage === "he"
      ? ["הפתיחה לא מספיק עוצרת", "הניסוח מעט כללי", "הקריאה לפעולה לא מספיק מורגשת"]
      : ["The opening is not stopping enough", "The wording is a bit generic", "The CTA is not strong enough"];

  const fallbackImprovements =
    safeLanguage === "he"
      ? ["לחזק את המשפט הראשון", "לחדד את הערך לקורא", "להוסיף יותר סקרנות או מתח", "לשפר את הסיום"]
      : ["Strengthen the first line", "Clarify the value for the reader", "Add more curiosity or tension", "Improve the ending"];

  const fallbackRaiseViral =
    safeLanguage === "he"
      ? ["להתחיל עם זווית חדה יותר", "להוריד ניסוחים כלליים", "להגדיל רצון לתגובה או שיתוף"]
      : ["Start with a sharper angle", "Reduce generic wording", "Increase the urge to comment or share"];

  const fallbackRaiseAuthentic =
    safeLanguage === "he"
      ? ["לכתוב פשוט יותר", "להישמע פחות מלוטש", "להוסיף טון אנושי וישיר"]
      : ["Use simpler wording", "Sound less polished", "Add a more direct human tone"];

  const fallbackRaiseEmotional =
    safeLanguage === "he"
      ? ["להכניס תחושה אישית יותר", "להשתמש במסר שפוגש צורך אמיתי", "לחזק את המטען הרגשי"]
      : ["Add a more personal feeling", "Use messaging that meets a real need", "Strengthen the emotional pull"];

  const fallbackRaiseCuriosity =
    safeLanguage === "he"
      ? ["ליצור פתיחה עם מתח", "להשאיר שאלה פתוחה", "לרמוז על תובנה לפני חשיפתה"]
      : ["Create a more tension-driven opening", "Leave an open loop", "Hint at the insight before revealing it"];

  const fallbackImprovedVersion =
    safeLanguage === "he"
      ? `${original}\n\nאם רוצים שהפוסט יעבוד טוב יותר ב-${safePlatform}, צריך לפתוח חזק יותר, לדבר מדויק יותר, ולסיים עם הנעה טבעית וברורה לפעולה.`
      : `${original}\n\nIf you want this post to perform better on ${safePlatform}, it needs a stronger opening, sharper wording, and a more natural clear action close.`;

  return {
    viralScore: normalized.viralScore || 62,
    authenticityScore: normalized.authenticityScore || 68,
    clarityScore: normalized.clarityScore || 70,
    emotionalScore: normalized.emotionalScore || 60,
    curiosityScore: normalized.curiosityScore || 58,
    hookScore: normalized.hookScore || 57,
    ctaScore: normalized.ctaScore || 55,
    summary: normalized.summary || fallbackSummary,
    whatWorks: normalized.whatWorks.length ? normalized.whatWorks : fallbackWhatWorks,
    whatHurts: normalized.whatHurts.length ? normalized.whatHurts : fallbackWhatHurts,
    improvements: normalized.improvements.length ? normalized.improvements : fallbackImprovements,
    raiseViralScore: normalized.raiseViralScore.length ? normalized.raiseViralScore : fallbackRaiseViral,
    raiseAuthenticityScore: normalized.raiseAuthenticityScore.length ? normalized.raiseAuthenticityScore : fallbackRaiseAuthentic,
    raiseEmotionalScore: normalized.raiseEmotionalScore.length ? normalized.raiseEmotionalScore : fallbackRaiseEmotional,
    raiseCuriosityScore: normalized.raiseCuriosityScore.length ? normalized.raiseCuriosityScore : fallbackRaiseCuriosity,
    improvedVersion: normalized.improvedVersion || fallbackImprovedVersion
  };
}

function buildGoalInterpretation(goal, language) {
  const safeLanguage = normalizeLanguage(language);
  const rawGoal = cleanString(goal).toLowerCase();

  if (!rawGoal) {
    return safeLanguage === "he"
      ? "לחזק את הפוסט בצורה כללית: יותר חד, יותר אנושי, יותר ברור"
      : "strengthen the post overall: sharper, more human, clearer";
  }

  const goalMap = [
    {
      keys: ["viral", "ויראל", "virality"],
      he: "להעלות סיכוי לעצירה, עניין, תגובות ושיתופים בלי להישמע זול",
      en: "increase stopping power, curiosity, comments, and shares without sounding cheap"
    },
    {
      keys: ["authentic", "human", "אותנט", "אנושי"],
      he: "להישמע יותר אמיתי, אישי, טבעי ופחות כמו AI",
      en: "sound more real, personal, natural, and less AI-like"
    },
    {
      keys: ["emotion", "emotional", "רגש"],
      he: "לחזק חיבור רגשי בלי להיות דרמטי מדי",
      en: "strengthen emotional connection without sounding overdramatic"
    },
    {
      keys: ["professional", "מקצוע", "authority"],
      he: "לחזק סמכות, אמינות וחדות מקצועית",
      en: "increase authority, credibility, and professional sharpness"
    },
    {
      keys: ["clear", "clarity", "ברור", "חד"],
      he: "לחדד את המסר כדי שיהיה ברור ומהיר להבנה",
      en: "make the message clearer and faster to understand"
    },
    {
      keys: ["cta", "convert", "conversion", "ממיר", "תגובה", "מכירה"],
      he: "לחזק כוונת פעולה ותגובה טבעית מהקהל",
      en: "strengthen action intent and natural audience response"
    }
  ];

  for (const item of goalMap) {
    if (item.keys.some((key) => rawGoal.includes(key))) {
      return safeLanguage === "he" ? item.he : item.en;
    }
  }

  return goal;
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

async function buildImproveBrief({
  post,
  goal,
  platform,
  language,
  style
}) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const styleText = getStyleText(style, safeLanguage);
  const platformRules = getPlatformRules(safePlatform, safeLanguage);
  const interpretedGoal = buildGoalInterpretation(goal, safeLanguage);

  const systemPrompt = `
You are a senior post improvement strategist.
Before rewriting, build a short internal improvement brief.
Focus on what is weak, what should stay, and what the rewrite should optimize.

Required JSON structure:
{
  "mainProblem": "",
  "improvementAngle": "",
  "primaryGoal": "",
  "toneDirection": "",
  "hookFix": "",
  "ctaFix": "",
  "keepElements": [],
  "removeElements": []
}
`;

  const userPrompt = `
Build an internal brief for improving this post.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}
Desired style: ${styleText}
Improvement goal: ${interpretedGoal}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Length: ${platformRules.length}

Original post:
${post}

Rules:
- identify the main weakness
- choose one strong improvement angle
- define what should be preserved
- define what should be removed or reduced
- define how to fix the hook
- define how to fix the CTA
- keep it concise and practical
`;

  const parsed = await askAIJson(systemPrompt, userPrompt, 450);

  return {
    mainProblem: cleanString(parsed?.mainProblem, "the post is too generic"),
    improvementAngle: cleanString(parsed?.improvementAngle, "make it sharper and more human"),
    primaryGoal: cleanString(parsed?.primaryGoal, interpretedGoal),
    toneDirection: cleanString(parsed?.toneDirection, styleText),
    hookFix: cleanString(parsed?.hookFix, "make the opening stronger"),
    ctaFix: cleanString(parsed?.ctaFix, "make the CTA more natural"),
    keepElements: cleanArray(parsed?.keepElements),
    removeElements: cleanArray(parsed?.removeElements)
  };
}

async function writeImprovedPost({
  post,
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
You are an elite social media editor.
You improve posts in a way that feels human, publishable, and platform-native.
Do not just rewrite randomly. Improve strategically.

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
Analyze and improve this post strategically.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}
Desired style: ${styleText}
Improvement goal: ${brief.primaryGoal}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Length: ${platformRules.length}

Internal improvement brief:
- Main problem: ${brief.mainProblem}
- Improvement angle: ${brief.improvementAngle}
- Tone direction: ${brief.toneDirection}
- Hook fix: ${brief.hookFix}
- CTA fix: ${brief.ctaFix}
- Keep elements: ${brief.keepElements.join(", ")}
- Remove or reduce: ${brief.removeElements.join(", ")}

Original post:
${post}

Rules:
- everything must be in ${getLanguageLabel(safeLanguage)}
- strengths must be short and real
- weaknesses must be short and real
- improvedPost = strongest balanced version
- moreViralVersion = more stopping power, curiosity, tension, shareability
- moreAuthenticVersion = more human, more natural, less AI, less forced
- do not make all three versions too similar
- do not overdo emojis
- do not make it cringe
- tips must be practical and short
`;

  return askAIJson(systemPrompt, userPrompt, 1000);
}

async function critiqueImprovedPost({
  post,
  goal,
  platform,
  language,
  draft,
  brief
}) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);

  const systemPrompt = `
You are a senior content critic for rewritten posts.
Your job is to upgrade the improvement result without changing the JSON structure.
Keep what is strong. Fix what is weak.

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
Review this improved output and make it stronger where needed.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}
Improvement goal: ${buildGoalInterpretation(goal, safeLanguage)}

Original post:
${post}

Internal brief for quality control:
- Main problem: ${brief.mainProblem}
- Improvement angle: ${brief.improvementAngle}
- Hook fix: ${brief.hookFix}
- CTA fix: ${brief.ctaFix}

Improve if:
- improvedPost is still generic
- moreViralVersion is not punchy enough
- moreAuthenticVersion still sounds too polished or AI-like
- the versions are too similar
- the CTA feels forced
- the output is not clearly better than the original

Current draft:
${JSON.stringify(draft)}
`;

  return askAIJson(systemPrompt, userPrompt, 1000);
}

async function improvePostWithQualityLoop({
  post,
  goal,
  platform,
  language,
  style
}) {
  const brief = await buildImproveBrief({
    post,
    goal,
    platform,
    language,
    style
  });

  const firstDraft = await writeImprovedPost({
    post,
    goal,
    platform,
    language,
    style,
    brief
  });

  if (!firstDraft || !hasEnoughImprovedContent(firstDraft)) {
    return {
      brief,
      finalDraft: fillImproveFallbacks(firstDraft, {
        post,
        goal,
        language,
        platform
      })
    };
  }

  const criticDraft = await critiqueImprovedPost({
    post,
    goal,
    platform,
    language,
    draft: firstDraft,
    brief
  });

  const selectedDraft =
    criticDraft && hasEnoughImprovedContent(criticDraft) ? criticDraft : firstDraft;

  const finalDraft = fillImproveFallbacks(selectedDraft, {
    post,
    goal,
    language,
    platform
  });

  return {
    brief,
    finalDraft
  };
}

async function buildAnalyzeBrief({
  post,
  platform,
  language
}) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const platformRules = getPlatformRules(safePlatform, safeLanguage);

  const systemPrompt = `
You are a senior social media analyst strategist.
Before scoring a post, build a short internal analysis brief.
Focus on what matters most for platform performance.

Required JSON structure:
{
  "postTypeGuess": "",
  "mainStrength": "",
  "mainWeakness": "",
  "performanceRisk": "",
  "hookAssessment": "",
  "ctaAssessment": "",
  "clarityAssessment": "",
  "emotionAssessment": "",
  "curiosityAssessment": "",
  "priorityFixes": []
}
`;

  const userPrompt = `
Build an internal analysis brief for this post.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Length: ${platformRules.length}

Post:
${post}

Rules:
- guess the likely type of post
- identify the strongest element
- identify the weakest performance point
- identify the main risk hurting results
- assess hook, CTA, clarity, emotion, and curiosity
- list 3-5 priority fixes
- keep it concise and practical
`;

  const parsed = await askAIJson(systemPrompt, userPrompt, 500);

  return {
    postTypeGuess: cleanString(parsed?.postTypeGuess, "general post"),
    mainStrength: cleanString(parsed?.mainStrength, "clear topic"),
    mainWeakness: cleanString(parsed?.mainWeakness, "not strong enough opening"),
    performanceRisk: cleanString(parsed?.performanceRisk, "generic phrasing"),
    hookAssessment: cleanString(parsed?.hookAssessment, "average"),
    ctaAssessment: cleanString(parsed?.ctaAssessment, "weak"),
    clarityAssessment: cleanString(parsed?.clarityAssessment, "good enough"),
    emotionAssessment: cleanString(parsed?.emotionAssessment, "moderate"),
    curiosityAssessment: cleanString(parsed?.curiosityAssessment, "limited"),
    priorityFixes: cleanArray(parsed?.priorityFixes)
  };
}

async function writePostAnalysis({
  post,
  platform,
  language,
  brief
}) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);
  const platformRules = getPlatformRules(safePlatform, safeLanguage);

  const systemPrompt = `
You are an elite social media analyst.
Score a post realistically and give useful platform-native recommendations.
Be specific, practical, and human.

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
Analyze this post deeply.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}

Platform rules:
- Tone: ${platformRules.tone}
- CTA: ${platformRules.cta}
- Length: ${platformRules.length}

Internal analysis brief:
- Post type guess: ${brief.postTypeGuess}
- Main strength: ${brief.mainStrength}
- Main weakness: ${brief.mainWeakness}
- Performance risk: ${brief.performanceRisk}
- Hook assessment: ${brief.hookAssessment}
- CTA assessment: ${brief.ctaAssessment}
- Clarity assessment: ${brief.clarityAssessment}
- Emotion assessment: ${brief.emotionAssessment}
- Curiosity assessment: ${brief.curiosityAssessment}
- Priority fixes: ${brief.priorityFixes.join(", ")}

Post:
${post}

Rules:
- everything must be in ${getLanguageLabel(safeLanguage)}
- all scores must be 0-100
- be realistic, not flattering
- summary must be short and useful
- whatWorks = things that genuinely help performance
- whatHurts = things that genuinely reduce performance
- improvements = top practical fixes
- raiseViralScore = specific actions to increase stopping power and sharing
- raiseAuthenticityScore = specific actions to sound more real and less AI
- raiseEmotionalScore = specific actions to deepen feeling or connection
- raiseCuriosityScore = specific actions to create intrigue, pull, and open loops
- improvedVersion must be clearly better and platform-fit
- do not be generic
`;

  return askAIJson(systemPrompt, userPrompt, 1000);
}

async function critiquePostAnalysis({
  post,
  platform,
  language,
  draft,
  brief
}) {
  const safeLanguage = normalizeLanguage(language);
  const safePlatform = normalizePlatform(platform);

  const systemPrompt = `
You are a senior critic for social media analysis outputs.
Improve the analysis if it is too generic, too soft, or not useful enough.
Keep the same JSON structure.

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
Review this analysis and make it more accurate and more useful where needed.

Language: ${getLanguageLabel(safeLanguage)}
Platform: ${safePlatform}

Original post:
${post}

Internal analysis brief for quality control:
- Main strength: ${brief.mainStrength}
- Main weakness: ${brief.mainWeakness}
- Performance risk: ${brief.performanceRisk}
- Priority fixes: ${brief.priorityFixes.join(", ")}

Improve if:
- the scores feel inflated
- the advice is too generic
- whatWorks is vague
- whatHurts is vague
- improvedVersion is not clearly stronger
- the analysis does not match the likely performance on this platform

Current draft:
${JSON.stringify(draft)}
`;

  return askAIJson(systemPrompt, userPrompt, 1000);
}

async function analyzePostWithQualityLoop({
  post,
  platform,
  language
}) {
  const brief = await buildAnalyzeBrief({
    post,
    platform,
    language
  });

  const firstDraft = await writePostAnalysis({
    post,
    platform,
    language,
    brief
  });

  if (!firstDraft || !hasEnoughAnalyzeContent(firstDraft)) {
    return {
      brief,
      finalDraft: fillAnalyzeFallbacks(firstDraft, {
        post,
        language,
        platform
      })
    };
  }

  const criticDraft = await critiquePostAnalysis({
    post,
    platform,
    language,
    draft: firstDraft,
    brief
  });

  const selectedDraft =
    criticDraft && hasEnoughAnalyzeContent(criticDraft) ? criticDraft : firstDraft;

  const finalDraft = fillAnalyzeFallbacks(selectedDraft, {
    post,
    language,
    platform
  });

  return {
    brief,
    finalDraft
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

app.post("/generate-post", async (req, res) => {
  try {
    const { topic, targetAudience, goal, style, platform, language } = req.body;

    const isHebrew = language === "he";

    const systemPrompt = `
You are a world-class social media content strategist.

You NEVER generate generic AI text.

You ALWAYS:
- Think before writing
- Build a strategic brief
- Write like a human
- Optimize for engagement and platform behavior

You specialize in:
- Viral hooks
- Emotional storytelling
- High-conversion CTAs
- Platform-native writing
`;

    const userPrompt = `
INPUT:
Topic: ${topic}
Audience: ${targetAudience}
Goal: ${goal}
Style: ${style}
Platform: ${platform}
Language: ${isHebrew ? "Hebrew" : "English"}

STEP 1 — BUILD INTERNAL BRIEF (do not show to user):
- What is the angle?
- What emotion leads?
- What triggers curiosity?
- What makes people stop scrolling?

STEP 2 — WRITE POST:
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
- Hook must be powerful and scroll-stopping
- Body must feel HUMAN (not AI)
- CTA must be action-driven
- Avoid generic phrases
- Adapt to platform (${platform})
- Write in ${isHebrew ? "Hebrew" : "English"}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.log("Parse failed, fallback triggered");

      parsed = {
        title: "",
        hook: raw,
        body: raw,
        cta: "",
        hashtags: [],
        shortVersion: raw,
        alternativeVersion: raw
      };
    }

    return res.json({ data: parsed });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Generate failed" });
  }
});

    const {
      post,
      language,
      style,
      goal,
      platform
    } = validateImprovePayload(req.body || {});

    if (!String(post).trim()) {
      return res.status(400).json({
        success: false,
        message: "post is required"
      });
    }

    const { finalDraft } = await improvePostWithQualityLoop({
      post,
      goal,
      platform,
      language,
      style
    });

    const normalized = normalizeImproveResponse(finalDraft);

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

    const {
      post,
      language,
      platform
    } = validateAnalyzePayload(req.body || {});

    if (!String(post).trim()) {
      return res.status(400).json({
        success: false,
        message: "post is required"
      });
    }

    const { finalDraft } = await analyzePostWithQualityLoop({
      post,
      platform,
      language
    });

    const normalized = normalizeAnalyzeResponse(finalDraft);

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
