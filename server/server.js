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
      en: "sound more real, personal, natural, and
