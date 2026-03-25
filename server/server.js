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
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
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
      he: "פוסט זורם, אישי, חד, עם פתיחה חזקה, קצב טוב, ושורת סיום טבעית שמניעה לפעולה.",
      en: "a flowing, personal, sharp post with a strong opening, good rhythm, and a natural action-driving ending."
    },
    facebook: {
      he: "פוסט אנושי, שיחתי, מחבר, מעט סיפורי, וקל מאוד לקריאה.",
      en: "a human, conversational, connective, slightly story-driven post that is very easy to read."
    },
    linkedin: {
      he: "פוסט מקצועי, בהיר, בעל סמכות, עם תובנה ברורה וערך ממשי.",
      en: "a professional, clear, authoritative post with a clear insight and real value."
    },
    tiktok: {
      he: "פוסט קצר, חד, עוצר גלילה, מסקרן ומהיר לקליטה.",
      en: "a short, punchy, scroll-stopping, curiosity-driven post that lands quickly."
    }
  };

  return map[safePlatform][safeLanguage];
}

function getStyleGuide(style, language) {
  const safeStyle = normalizeStyle(style);
  const safeLanguage = normalizeLanguage(language);

  const map = {
    kabbalist: {
      he: "עמוק, תודעתי, רוחני, חד, אבל עדיין קריא וברור.",
      en: "deep, conscious, spiritual, and sharp, while still staying readable and clear."
    },
    mentor: {
      he: "בטוח, מוביל, ברור, מעשי, עם תחושת הכוונה.",
      en: "confident, guiding, clear, practical, and mentor-like."
    },
    humorous: {
      he: "קליל, שנון, זורם, לא ילדותי ולא מאולץ.",
      en: "light, witty, flowing, not childish and not forced."
    },
    spiritual: {
      he: "רך, עמוק, מחבר, עם תחושת משמעות ושקט.",
      en: "gentle, deep, connective, meaningful, and calm."
    },
    emotional: {
      he: "אנושי, אישי, נוגע, מרגש, בלי דרמה מזויפת.",
      en: "human, personal, touching, emotional, without fake drama."
    },
    professional: {
      he: "נקי, חכם, מקצועי, בטוח, ולא יבש.",
      en: "clean, smart, professional, confident, and not dry."
    }
  };

  return map[safeStyle][safeLanguage];
}

function getGoalGuide(goal, language) {
  const safeGoal = cleanString(goal).toLowerCase();
  const safeLanguage = normalizeLanguage(language);

  if (!safeGoal) {
    return safeLanguage === "he"
      ? "לחזק את הפוסט כך שיהיה חד, אנושי, ברור ומותאם לפלטפורמה."
      : "strengthen the post so it becomes sharper, more human, clearer, and more platform-native.";
  }

  const rules = [
    {
      match: ["viral", "engagement", "share", "attention", "ויראל", "מעורבות", "חשיפה"],
      he: "להגדיל עצירה, מתח, חדות, פוטנציאל שיתוף ותגובות.",
      en: "increase stopping power, tension, sharpness, shareability, and engagement."
    },
    {
      match: ["human", "authentic", "natural", "אנושי", "טבעי", "אותנטי"],
      he: "להישמע טבעי יותר, אנושי יותר, ופחות כמו טקסט של AI.",
      en: "sound more natural, more human, and less like AI text."
    },
    {
      match: ["emotion", "emotional", "רגש", "רגשי"],
      he: "לחזק חיבור רגשי, עומק, והזדהות.",
      en: "increase emotional connection, depth, and relatability."
    },
    {
      match: ["clear", "clarity", "ברור", "בהיר"],
      he: "לחדד מסר, להסיר רעש, ולהבהיר את הערך.",
      en: "sharpen the message, remove noise, and clarify the value."
    },
    {
      match: ["hook", "opening", "פתיחה", "הוק"],
      he: "לחזק את שורת הפתיחה כדי לעצור גלילה מהר יותר.",
      en: "strengthen the opening line to stop the scroll faster."
    },
    {
      match: ["cta", "action", "conversion", "הנעה", "פעולה"],
      he: "לחזק את הסיום וההנעה לפעולה כך שירגישו טבעיים ומשכנעים יותר.",
      en: "strengthen the ending and the call to action so they feel more natural and more persuasive."
    },
    {
      match: ["professional", "authority", "מקצועי", "סמכות"],
      he: "לחזק סמכות, בהירות וערך מקצועי.",
      en: "increase authority, clarity, and professional value."
    },
    {
      match: ["curious", "curiosity", "מסקרן", "סקרנות"],
      he: "ליצור יותר מסקרנות, יותר עניין, ויותר סיבה להמשיך לקרוא.",
      en: "create more intrigue, more curiosity, and a stronger reason to keep reading."
    },
    {
      match: ["sharp", "sharper", "חד", "חדות"],
      he: "להפוך את המסר לחד יותר, ישיר יותר, ופחות רך או מפוזר.",
      en: "make the message sharper, more direct, and less soft or scattered."
    }
  ];

  const found = rules.find((rule) =>
    rule.match.some((term) => safeGoal.includes(term))
  );

  if (found) {
    return safeLanguage === "he" ? found.he : found.en;
  }

  return cleanString(goal);
}

function detectImproveMode(goal) {
  const safeGoal = cleanString(goal).toLowerCase();

  const modes = [
    {
      key: "fix_hook",
      match: ["fix hook", "hook", "opening", "פתיחה", "הוק"]
    },
    {
      key: "fix_cta",
      match: ["fix cta", "cta", "call to action", "הנעה", "פעולה"]
    },
    {
      key: "more_viral",
      match: ["more viral", "viral", "engagement", "share", "ויראל", "מעורבות", "חשיפה"]
    },
    {
      key: "more_human",
      match: ["more human", "human", "authentic", "natural", "אנושי", "אותנטי", "טבעי"]
    },
    {
      key: "more_emotional",
      match: ["more emotional", "emotional", "emotion", "רגשי", "רגש"]
    },
    {
      key: "more_clear",
      match: ["more clear", "clearer", "clear", "clarity", "ברור", "בהיר"]
    },
    {
      key: "more_professional",
      match: ["more professional", "professional", "authority", "מקצועי", "סמכות"]
    },
    {
      key: "more_curious",
      match: ["more curious", "curious", "curiosity", "מסקרן", "סקרנות"]
    },
    {
      key: "more_sharp",
      match: ["more sharp", "sharper", "sharp", "חד", "חדות"]
    }
  ];

  const found = modes.find((mode) =>
    mode.match.some((term) => safeGoal.includes(term))
  );

  return found ? found.key : "balanced";
}

function getImproveModeGuide(mode, language) {
  const isHebrew = normalizeLanguage(language) === "he";

  const guides = {
    fix_hook: {
      he: "המטרה הראשית: לשפר קודם כל את שורת הפתיחה. הפתיחה חייבת לעצור גלילה, להיות חדה יותר, מסקרנת יותר, ואנושית יותר. שאר הפוסט צריך להישאר עקבי עם הפתיחה החדשה.",
      en: "Primary goal: improve the opening first. The opening must stop the scroll, feel sharper, more curiosity-driven, and more human. The rest of the post should stay aligned with the stronger opening."
    },
    fix_cta: {
      he: "המטרה הראשית: לשפר קודם כל את הסיום וההנעה לפעולה. ה-CTA צריך להיות טבעי, משכנע, מחובר לתוכן, וברור יותר.",
      en: "Primary goal: improve the ending and CTA first. The CTA should feel natural, persuasive, connected to the content, and clearer."
    },
    more_viral: {
      he: "המטרה הראשית: להעלות פוטנציאל ויראלי דרך יותר מתח, יותר חדות, יותר framing, ויותר shareability בלי להיות קרינג'י.",
      en: "Primary goal: increase viral potential through stronger tension, sharper framing, stronger punch, and more shareability without sounding cringe."
    },
    more_human: {
      he: "המטרה הראשית: להוריד תחושת AI ולכתוב כמו אדם אמיתי. השפה צריכה להיות טבעית, זורמת, אנושית, ואמינה יותר.",
      en: "Primary goal: reduce AI-feel and make the writing sound like a real person. The language should feel more natural, flowing, human, and believable."
    },
    more_emotional: {
      he: "המטרה הראשית: להעמיק רגש, חיבור, ותחושת אמת בלי להגזים או להפוך לדרמטי מדי.",
      en: "Primary goal: deepen emotion, connection, and felt truth without becoming exaggerated or overly dramatic."
    },
    more_clear: {
      he: "המטרה הראשית: להפוך את הפוסט לברור יותר, ממוקד יותר, וקצר יותר איפה שצריך. להסיר רעש ולחדד את הערך.",
      en: "Primary goal: make the post clearer, more focused, and tighter where needed. Remove noise and sharpen the value."
    },
    more_professional: {
      he: "המטרה הראשית: להישמע יותר מקצועי, בטוח, חכם ובעל סמכות, בלי להיות יבש או כבד.",
      en: "Primary goal: sound more professional, confident, smart, and authoritative without becoming dry or heavy."
    },
    more_curious: {
      he: "המטרה הראשית: להגדיל סקרנות, ליצור פערים מסקרנים, ולתת לאנשים סיבה להמשיך לקרוא.",
      en: "Primary goal: increase curiosity, create intrigue gaps, and give people a stronger reason to keep reading."
    },
    more_sharp: {
      he: "המטרה הראשית: להפוך את הפוסט לחד יותר, ישיר יותר, מדויק יותר, ופחות מרוכך.",
      en: "Primary goal: make the post sharper, more direct, more precise, and less softened."
    },
    balanced: {
      he: "המטרה הראשית: לשפר את הפוסט בצורה מאוזנת כך שיהיה חזק יותר, אנושי יותר, ברור יותר, ומותאם לפלטפורמה.",
      en: "Primary goal: improve the post in a balanced way so it becomes stronger, more human, clearer, and more platform-native."
    }
  };

  return isHebrew ? guides[mode].he : guides[mode].en;
}

function normalizeHashtags(value) {
  return cleanArray(value)
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter(Boolean)
    .slice(0, 12);
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
    strengths: cleanArray(data?.strengths).slice(0, 6),
    weaknesses: cleanArray(data?.weaknesses).slice(0, 6),
    improvedPost: cleanString(data?.improvedPost),
    moreViralVersion: cleanString(data?.moreViralVersion),
    moreAuthenticVersion: cleanString(data?.moreAuthenticVersion),
    tips: cleanArray(data?.tips).slice(0, 6)
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
    whatWorks: cleanArray(data?.whatWorks).slice(0, 6),
    whatHurts: cleanArray(data?.whatHurts).slice(0, 6),
    improvements: cleanArray(data?.improvements).slice(0, 6),
    raiseViralScore: cleanArray(data?.raiseViralScore).slice(0, 5),
    raiseAuthenticityScore: cleanArray(data?.raiseAuthenticityScore).slice(0, 5),
    raiseEmotionalScore: cleanArray(data?.raiseEmotionalScore).slice(0, 5),
    raiseCuriosityScore: cleanArray(data?.raiseCuriosityScore).slice(0, 5),
    improvedVersion: cleanString(data?.improvedVersion)
  };
}

function buildGenerateFallback({ topic, language }) {
  const isHebrew = normalizeLanguage(language) === "he";
  const safeTopic = cleanString(topic) || (isHebrew ? "הנושא שלך" : "your topic");

  return {
    title: isHebrew ? `מחשבה חדה על ${safeTopic}` : `A sharper thought on ${safeTopic}`,
    hook: isHebrew
      ? `רוב האנשים מדברים על ${safeTopic} בצורה רגילה מדי. וזה בדיוק מה שמחליש את המסר.`
      : `Most people talk about ${safeTopic} in a way that is too ordinary. That is exactly what weakens the message.`,
    body: isHebrew
      ? `כדי שפוסט באמת יעבוד, הוא צריך להיות ברור, אנושי, חד, ולהרגיש כאילו אדם אמיתי כתב אותו. כשיש זווית טובה וניסוח נקי, אנשים לא רק קוראים — הם גם מגיבים.`
      : `For a post to really work, it needs to feel clear, human, sharp, and like it was written by a real person. When the angle is strong and the phrasing is clean, people do not just read — they react.`,
    cta: isHebrew
      ? `אם זה פוגש אותך, כתוב לי מה הכי דיבר אליך.`
      : `If this resonates, tell me what hit you the most.`,
    hashtags: isHebrew ? ["תוכן", "שיווק", "פוסט"] : ["content", "marketing", "post"],
    shortVersion: isHebrew
      ? `${safeTopic} צריך מסר חד, ברור ואנושי יותר כדי באמת לעבוד.`
      : `${safeTopic} needs a sharper, clearer, more human message to truly work.`,
    alternativeVersion: isHebrew
      ? `לפעמים לא צריך לשנות את הרעיון — רק לנסח אותו נכון יותר כדי שאנשים באמת יעצרו עליו.`
      : `Sometimes you do not need a different idea — you just need to frame it better so people actually stop for it.`
  };
}

function buildImproveFallback({ post, language }) {
  const isHebrew = normalizeLanguage(language) === "he";
  const safePost = cleanString(post);

  return {
    strengths: isHebrew ? ["יש כאן בסיס טוב"] : ["There is a solid foundation here"],
    weaknesses: isHebrew
      ? ["הניסוח עדיין יכול להיות חד יותר"]
      : ["The phrasing can still become sharper"],
    improvedPost: safePost,
    moreViralVersion: safePost,
    moreAuthenticVersion: safePost,
    tips: isHebrew
      ? ["חזק את הפתיחה", "קצר רעש מיותר", "סיים עם CTA טבעי"]
      : ["Strengthen the opening", "Remove extra noise", "End with a natural CTA"]
  };
}

function buildAnalyzeFallback({ post, language }) {
  const isHebrew = normalizeLanguage(language) === "he";
  const safePost = cleanString(post);

  return {
    viralScore: 61,
    authenticityScore: 69,
    clarityScore: 67,
    emotionalScore: 59,
    curiosityScore: 57,
    hookScore: 56,
    ctaScore: 54,
    summary: isHebrew
      ? "יש כאן בסיס טוב, אבל הפוסט עדיין לא חד מספיק, לא אנושי מספיק, ולא מניע מספיק לפעולה."
      : "There is a solid base here, but the post is still not sharp enough, human enough, or action-driving enough.",
    whatWorks: isHebrew
      ? ["המסר מובן", "יש כיוון", "יש בסיס שניתן לחזק"]
      : ["The message is understandable", "There is direction", "There is a base worth strengthening"],
    whatHurts: isHebrew
      ? ["הפתיחה לא עוצרת מספיק", "הטון מעט גנרי", "הסיום לא מניע מספיק"]
      : ["The opening does not stop the scroll enough", "The tone feels a bit generic", "The ending does not drive enough action"],
    improvements: isHebrew
      ? ["לחזק את ה-Hook", "להישמע יותר טבעי", "לחדד את ה-CTA"]
      : ["Strengthen the hook", "Sound more natural", "Sharpen the CTA"],
    raiseViralScore: isHebrew
      ? ["ליצור זווית חדה יותר", "להוסיף מתח", "להפוך את המסר ליותר שיתופי"]
      : ["Create a sharper angle", "Add tension", "Make the message more shareable"],
    raiseAuthenticityScore: isHebrew
      ? ["להוריד ניסוח רובוטי", "לכתוב כמו אדם אמיתי", "לשמור על שפה טבעית"]
      : ["Reduce robotic phrasing", "Write like a real person", "Keep the language natural"],
    raiseEmotionalScore: isHebrew
      ? ["להכניס יותר תחושה", "לחבר לחוויה אמיתית", "ליצור עומק רגשי"]
      : ["Add more feeling", "Connect to a real experience", "Create emotional depth"],
    raiseCuriosityScore: isHebrew
      ? ["לפתוח פער מסקרן", "לרמוז בלי לחשוף הכל", "לתת סיבה להמשיך לקרוא"]
      : ["Open a curiosity gap", "Hint without revealing everything", "Give a reason to keep reading"],
    improvedVersion: safePost
  };
}

async function runJsonCompletion({
  systemPrompt,
  userPrompt,
  fallback,
  temperature = 0.8
}) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  return safeJsonParse(raw, fallback);
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "PostPulse AI API",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok"
  });
});

app.post("/generate-post", async (req, res) => {
  try {
    const topic = cleanString(req.body?.topic);
    const targetAudience = cleanString(req.body?.targetAudience, "General audience");
    const goal = cleanString(req.body?.goal);
    const style = normalizeStyle(req.body?.style);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const systemPrompt = `
You are PostPulse AI's elite social media writing engine.

You never write generic AI content.
You always think strategically before writing.

Your job:
- find the strongest angle
- find the strongest emotional direction
- write a strong hook
- write a human body
- write a natural CTA
- adapt tightly to the platform
- make the post feel native, sharp, real, and readable

Core rules:
- sound like a real human, not AI
- avoid bland motivational filler
- avoid fake hype
- avoid robotic phrasing
- avoid repetitive rhythm
- make every sentence earn its place
- commit to one main angle
- create clear stopping power in the opening
- keep the CTA natural, not forced

Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Topic: ${topic}
Audience: ${targetAudience}
Goal: ${goal || "Create a strong post"}
Goal guidance: ${getGoalGuide(goal, language)}
Style: ${style}
Style guide: ${getStyleGuide(style, language)}
Platform: ${platform}
Platform guide: ${getPlatformGuide(platform, language)}
Language: ${getLanguageLabel(language)}

STEP 1 — STRATEGIC THINKING (DO NOT OUTPUT):
- What is the strongest angle for this topic?
- What emotional direction will make people care?
- What would make someone stop scrolling here?
- What is the clearest value or insight?
- What would make this feel human and not AI?

STEP 2 — BUILD STRUCTURE:
- Write a HOOK that creates immediate stopping power
- Build a BODY that is sharp, clear, and human
- End with a CTA that feels natural but drives action

STEP 3 — QUALITY RULES:
- Avoid generic AI phrases
- Avoid motivational clichés
- Avoid fluff
- Avoid repetition
- Each sentence must earn its place
- Use natural human tone
- Keep flow and rhythm
- Match ${platform} style perfectly

STEP 4 — OUTPUT JSON:
{
  "title": "",
  "hook": "",
  "body": "",
  "cta": "",
  "hashtags": [],
  "shortVersion": "",
  "alternativeVersion": ""
}

STRICT RULES:
- Write only in ${getLanguageLabel(language)}
- Hook MUST be scroll-stopping
- Body MUST feel human, not AI
- CTA MUST feel natural (not forced)
- Alternative version must feel meaningfully different
`;

    const parsed = await runJsonCompletion({
      systemPrompt,
      userPrompt,
      fallback: buildGenerateFallback({ topic, language }),
      temperature: 0.9
    });

    const normalized = normalizeGenerateData(parsed);

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
});

app.post("/improve-post", async (req, res) => {
  try {
    const post = cleanString(req.body?.post);
    const goal = cleanString(req.body?.goal);
    const style = normalizeStyle(req.body?.style);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);
    const improveMode = detectImproveMode(goal);

    if (!post) {
      return res.status(400).json({ error: "Post is required" });
    }

    const systemPrompt = `
You are PostPulse AI's elite content improvement engine.

You do not rewrite blindly.
You diagnose first, then improve with precision.

You specialize in:
- stronger hooks
- clearer messaging
- more human tone
- stronger emotional weight
- tighter platform fit
- stronger CTA
- lower AI-feel
- better viral framing when needed

You must follow the user's improvement mode exactly.
If the mode is focused, you must prioritize that area first.

Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Original post: ${post}
Goal: ${goal || "Make it stronger"}
Detected improve mode: ${improveMode}
Goal guidance: ${getGoalGuide(goal, language)}
Mode guidance: ${getImproveModeGuide(improveMode, language)}
Style: ${style}
Style guide: ${getStyleGuide(style, language)}
Platform: ${platform}
Platform guide: ${getPlatformGuide(platform, language)}
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

Core diagnosis rules:
- diagnose real strengths only
- diagnose real weaknesses only
- keep what is already strong
- fix the most important weak points first
- do not flatten the post into bland AI content

Mode rules:
- fix_hook: improve the opening first; the first line should become significantly stronger
- fix_cta: improve the ending and call to action first
- more_viral: increase tension, punch, framing, and engagement potential
- more_human: reduce robotic phrasing and make it sound like a real person
- more_emotional: deepen feeling and emotional connection
- more_clear: make the message cleaner, tighter, and easier to understand
- more_professional: make it sound more authoritative, smart, and polished
- more_curious: increase intrigue and open loops
- more_sharp: make it more direct, tighter, and more cutting
- balanced: improve the post holistically

Output rules:
- write only in ${getLanguageLabel(language)}
- strengths must be short and real
- weaknesses must be short and real
- improvedPost must reflect the detected mode first
- moreViralVersion must be the strongest higher-engagement version
- moreAuthenticVersion must be the strongest lower-AI-feel version
- tips must be short and practical
- avoid cringe and generic phrasing
- keep the result natural and platform-native

Extra strict rules by mode:
${
  improveMode === "fix_hook"
    ? "- improvedPost must open with a clearly stronger hook than the original."
    : ""
}
${
  improveMode === "fix_cta"
    ? "- improvedPost must end with a clearly stronger CTA than the original."
    : ""
}
${
  improveMode === "more_human"
    ? "- improvedPost must sound noticeably less robotic and more conversational."
    : ""
}
${
  improveMode === "more_clear"
    ? "- improvedPost must be cleaner and easier to follow, with less noise."
    : ""
}
${
  improveMode === "more_emotional"
    ? "- improvedPost must create noticeably stronger feeling and resonance."
    : ""
}
${
  improveMode === "more_viral"
    ? "- improvedPost must be punchier and more shareable without becoming cheesy."
    : ""
}
${
  improveMode === "more_professional"
    ? "- improvedPost must feel more polished, credible, and authoritative."
    : ""
}
${
  improveMode === "more_curious"
    ? "- improvedPost must create stronger curiosity and a better reason to keep reading."
    : ""
}
${
  improveMode === "more_sharp"
    ? "- improvedPost must feel tighter, sharper, and more decisive."
    : ""
}
`;

    const parsed = await runJsonCompletion({
      systemPrompt,
      userPrompt,
      fallback: buildImproveFallback({ post, language }),
      temperature: 0.82
    });

    const normalized = normalizeImproveData(parsed);

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
});

app.post("/analyze-post", async (req, res) => {
  try {
    const post = cleanString(req.body?.post);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!post) {
      return res.status(400).json({ error: "Post is required" });
    }

    const systemPrompt = `
You are PostPulse AI's elite content critic and performance strategist.

You analyze honestly.
You do not flatter weak writing.
You score only by real performance potential.

You evaluate:
- hook strength
- clarity
- authenticity
- emotional impact
- curiosity
- CTA quality
- viral potential

Your analysis must be practical, sharp, and platform-aware.

Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Post: ${post}
Platform: ${platform}
Platform guide: ${getPlatformGuide(platform, language)}
Language: ${getLanguageLabel(language)}

Return JSON only in this exact structure:
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

Scoring rules:
- scores must be integers from 0 to 100
- do not inflate scores
- average writing should not get premium scores
- weak writing should get clearly weak scores
- hookScore = true stopping power in the first line
- ctaScore = true action-driving power of the ending
- authenticityScore = how human vs robotic it sounds
- clarityScore = how clear, sharp, and easy to follow it is
- emotionalScore = real emotional weight, not fake drama
- curiosityScore = how much forward momentum and intrigue it creates
- viralScore = shareability, tension, framing, memorability, and engagement potential

Analysis rules:
- write only in ${getLanguageLabel(language)}
- be honest, direct, and useful
- whatWorks must mention only real strengths
- whatHurts must mention the biggest real problems
- improvements must be practical next steps
- raiseViralScore should focus on stronger framing, tension, and shareability
- raiseAuthenticityScore should focus on natural tone, human wording, and lower AI feel
- raiseEmotionalScore should focus on stronger feeling, relevance, and resonance
- raiseCuriosityScore should focus on intrigue, open loops, and stronger reason to keep reading

Improved version rules:
- improvedVersion must be meaningfully stronger than the original
- it must directly fix the biggest weaknesses
- it must sound more human
- it must match ${platform} naturally
- it must have a stronger hook and a stronger CTA than the original
`;

    const parsed = await runJsonCompletion({
      systemPrompt,
      userPrompt,
      fallback: buildAnalyzeFallback({ post, language }),
      temperature: 0.68
    });

    const normalized = normalizeAnalyzeData(parsed);

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
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

app.listen(PORT, () => {
  console.log(`PostPulse server running on port ${PORT}`);
});
