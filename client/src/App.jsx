import { useEffect, useMemo, useState } from "react";
import { analyzePost, generatePost, improvePost } from "./api";
import { translations } from "./translations";
import "./App.css";

const styleOptions = [
  { value: "kabbalist", he: "קבליסט", en: "Kabbalist" },
  { value: "mentor", he: "מנטור", en: "Mentor" },
  { value: "humorous", he: "הומוריסטי", en: "Humorous" },
  { value: "spiritual", he: "רוחני", en: "Spiritual" },
  { value: "emotional", he: "רגשי", en: "Emotional" },
  { value: "professional", he: "מקצועי", en: "Professional" }
];

const platformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" }
];

const HISTORY_STORAGE_KEY = "postpulse_history_v1";
const HISTORY_LIMIT = 20;

function Section({ title, children, onCopy, copyLabel }) {
  return (
    <div className="result-section">
      <div className="section-header">
        <h3>{title}</h3>
        {onCopy ? (
          <button type="button" className="copy-btn" onClick={onCopy}>
            {copyLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ListBlock({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <ul className="result-list">
      {items.map((item, index) => (
        <li key={`${String(item)}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function ScoreCard({ label, value }) {
  const num = Number(value);
  const safeValue = Number.isFinite(num) ? Math.round(num) : 0;

  return (
    <div className="score-card">
      <div className="score-value">{safeValue}%</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function safeJsonParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function buildHistoryPreview(item, language) {
  if (!item || !item.data) return "";
  const isHebrew = language === "he";

  if (item.type === "build") {
    return (
      item.data.hook ||
      item.data.title ||
      (isHebrew ? "פוסט חדש שנוצר" : "Generated post")
    );
  }

  if (item.type === "improve") {
    return (
      item.data.improvedPost ||
      item.data.moreViralVersion ||
      (isHebrew ? "פוסט ששופר" : "Improved post")
    );
  }

  if (item.type === "analyze") {
    return (
      item.data.summary ||
      item.data.improvedVersion ||
      (isHebrew ? "ניתוח פוסט" : "Post analysis")
    );
  }

  return "";
}

function buildHistoryTitle(item, language) {
  const isHebrew = language === "he";

  if (item.type === "build") {
    return item.data?.title || (isHebrew ? "פוסט שנוצר" : "Generated Post");
  }

  if (item.type === "improve") {
    return isHebrew ? "פוסט משופר" : "Improved Post";
  }

  if (item.type === "analyze") {
    return isHebrew ? "ניתוח פוסט" : "Post Analysis";
  }

  return isHebrew ? "פריט" : "Item";
}

function formatHistoryTime(timestamp, language) {
  try {
    const locale = language === "he" ? "he-IL" : "en-US";
    return new Date(timestamp).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function slugifyFileName(value) {
  return (
    String(value || "postpulse")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05FF\s_-]+/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) || "postpulse"
  );
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildExportContent(result, t, language) {
  if (!result || !result.type || !result.data) return "";

  const separator = "\n\n";
  const joinList = (items) =>
    Array.isArray(items) && items.length
      ? items.map((item) => `- ${item}`).join("\n")
      : "";

  if (result.type === "build") {
    return [
      `${t.title}:`,
      result.data.title || "",
      `${t.hook}:`,
      result.data.hook || "",
      `${t.body}:`,
      result.data.body || "",
      `${t.cta}:`,
      result.data.cta || "",
      `${t.hashtags}:`,
      Array.isArray(result.data.hashtags) ? result.data.hashtags.join(" ") : "",
      `${t.shortVersion}:`,
      result.data.shortVersion || "",
      `${t.alternativeVersion}:`,
      result.data.alternativeVersion || ""
    ]
      .filter((item) => item !== "")
      .join(separator);
  }

  if (result.type === "improve") {
    return [
      `${t.strengths}:`,
      joinList(result.data.strengths),
      `${t.weaknesses}:`,
      joinList(result.data.weaknesses),
      `${t.improvedVersion}:`,
      result.data.improvedPost || "",
      `${t.moreViralVersion}:`,
      result.data.moreViralVersion || "",
      `${t.moreAuthenticVersion}:`,
      result.data.moreAuthenticVersion || "",
      `${t.tips}:`,
      joinList(result.data.tips)
    ]
      .filter((item) => item !== "")
      .join(separator);
  }

  if (result.type === "analyze") {
    return [
      `${t.viralScore}: ${result.data.viralScore ?? 0}%`,
      `${t.authenticityScore}: ${result.data.authenticityScore ?? 0}%`,
      `${t.clarityScore}: ${result.data.clarityScore ?? 0}%`,
      `${t.emotionalScore}: ${result.data.emotionalScore ?? 0}%`,
      `${t.curiosityScore}: ${result.data.curiosityScore ?? 0}%`,
      `${t.hookScore}: ${result.data.hookScore ?? 0}%`,
      `${t.ctaScore}: ${result.data.ctaScore ?? 0}%`,
      "",
      `${t.summary}:`,
      result.data.summary || "",
      `${t.whatWorks}:`,
      joinList(result.data.whatWorks),
      `${t.whatHurts}:`,
      joinList(result.data.whatHurts),
      `${t.improvements}:`,
      joinList(result.data.improvements),
      `${t.raiseViralScore}:`,
      joinList(result.data.raiseViralScore),
      `${t.raiseAuthenticityScore}:`,
      joinList(result.data.raiseAuthenticityScore),
      `${t.raiseEmotionalScore}:`,
      joinList(result.data.raiseEmotionalScore),
      `${t.raiseCuriosityScore}:`,
      joinList(result.data.raiseCuriosityScore),
      `${t.improvedVersion}:`,
      result.data.improvedVersion || ""
    ]
      .filter((item) => item !== "")
      .join(separator);
  }

  return language === "he" ? "אין תוכן לייצוא" : "No content to export";
}

function buildExportFilename(result) {
  if (!result || !result.type || !result.data) {
    return "postpulse-export.txt";
  }

  if (result.type === "build") {
    const title = slugifyFileName(result.data.title || "generated-post");
    return `${title}.txt`;
  }

  if (result.type === "improve") {
    return "postpulse-improved-post.txt";
  }

  if (result.type === "analyze") {
    return "postpulse-analysis.txt";
  }

  return "postpulse-export.txt";
}

function getWeakestArea(data, t) {
  if (!data) return null;

  const options = [
    {
      key: "hook",
      score: Number(data.hookScore ?? 0),
      actionLabel: t.quickFixHook,
      goal: t.goalPresetFixHook,
      message: t.smartWeakHook
    },
    {
      key: "cta",
      score: Number(data.ctaScore ?? 0),
      actionLabel: t.quickFixCta,
      goal: t.goalPresetFixCta,
      message: t.smartWeakCta
    },
    {
      key: "viral",
      score: Number(data.viralScore ?? 0),
      actionLabel: t.quickMakeViral,
      goal: t.goalPresetMoreViral,
      message: t.smartWeakViral
    },
    {
      key: "authenticity",
      score: Number(data.authenticityScore ?? 0),
      actionLabel: t.quickMakeHuman,
      goal: t.goalPresetMoreHuman,
      message: t.smartWeakAuthenticity
    },
    {
      key: "emotional",
      score: Number(data.emotionalScore ?? 0),
      actionLabel: t.quickMakeEmotional,
      goal: t.goalPresetMoreEmotional,
      message: t.smartWeakEmotional
    },
    {
      key: "curiosity",
      score: Number(data.curiosityScore ?? 0),
      actionLabel: t.quickMakeCurious,
      goal: t.goalPresetMoreCurious,
      message: t.smartWeakCuriosity
    },
    {
      key: "clarity",
      score: Number(data.clarityScore ?? 0),
      actionLabel: t.quickMakeClear,
      goal: t.goalPresetMoreClear,
      message: t.smartWeakClarity
    }
  ];

  options.sort((a, b) => a.score - b.score);
  return options[0];
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [history, setHistory] = useState([]);

  const t = useMemo(() => translations[language], [language]);
  const dir = language === "he" ? "rtl" : "ltr";

  const buildGoalPresets = useMemo(
    () => [
      t.goalPresetViral,
      t.goalPresetHuman,
      t.goalPresetProfessional,
      t.goalPresetEmotional,
      t.goalPresetSales,
      t.goalPresetEngagement
    ],
    [t]
  );

  const improveGoalPresets = useMemo(
    () => [
      t.goalPresetMoreViral,
      t.goalPresetMoreHuman,
      t.goalPresetMoreClear,
      t.goalPresetMoreEmotional,
      t.goalPresetMoreSharp,
      t.goalPresetMoreProfessional,
      t.goalPresetFixHook,
      t.goalPresetFixCta,
      t.goalPresetMoreCurious
    ],
    [t]
  );

  const [buildForm, setBuildForm] = useState({
    topic: "",
    targetAudience: "",
    goal: "",
    style: "professional",
    platform: "instagram"
  });

  const [improveForm, setImproveForm] = useState({
    post: "",
    goal: "",
    style: "professional",
    platform: "instagram"
  });

  const [analyzeForm, setAnalyzeForm] = useState({
    post: "",
    platform: "instagram"
  });

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = safeJsonParse(raw || "[]", []);
    setHistory(Array.isArray(parsed) ? parsed : []);
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const copiedLabel = language === "he" ? "הועתק" : "Copied";
  const improveFromAnalyzeLabel =
    language === "he" ? "העבר חזרה ל־Improve" : "Move Back to Improve";
  const analyzeFromImproveLabel =
    language === "he" ? "נתח את הגרסה המשופרת" : "Analyze Improved Version";

  const weakestArea =
    result && result.type === "analyze"
      ? getWeakestArea(result.data, t)
      : null;

  function setBuildField(field, value) {
    setBuildForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function setImproveField(field, value) {
    setImproveForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function setAnalyzeField(field, value) {
    setAnalyzeForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function switchTab(nextTab) {
    setError("");
    setTab(nextTab);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopyMessage(copiedLabel);

      setTimeout(() => {
        setCopyMessage("");
      }, 1800);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  function startRequest() {
    setError("");
    setCopyMessage("");
    setResult(null);
    setLoading(true);
  }

  function endRequest() {
    setLoading(false);
  }

  function addToHistory(item) {
    const savedItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...item
    };

    setHistory((prev) => [savedItem, ...prev].slice(0, HISTORY_LIMIT));
  }

  function removeHistoryItem(id) {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  function saveCurrentResult() {
    if (!result || !result.type || !result.data) return;

    addToHistory({
      type: result.type,
      language,
      data: result.data
    });

    setCopyMessage(t.savedToHistory);

    setTimeout(() => {
      setCopyMessage("");
    }, 1800);
  }

  function exportCurrentResult() {
    if (!result) return;

    const content = buildExportContent(result, t, language);
    const filename = buildExportFilename(result);

    downloadTextFile(filename, content);

    setCopyMessage(t.exportReady);

    setTimeout(() => {
      setCopyMessage("");
    }, 1800);
  }

  function exportHistoryItem(item) {
    const historyResult = {
      type: item.type,
      data: item.data
    };

    const content = buildExportContent(historyResult, t, language);
    const filename = buildExportFilename(historyResult);

    downloadTextFile(filename, content);
  }

  function loadHistoryItem(item) {
    if (!item) return;

    setResult({
      type: item.type,
      data: item.data
    });

    if (item.type === "build") {
      setTab("build");
    }

    if (item.type === "improve") {
      setImproveForm((prev) => ({
        ...prev,
        post:
          item.data?.improvedPost ||
          item.data?.moreAuthenticVersion ||
          item.data?.moreViralVersion ||
          prev.post
      }));
      setTab("improve");
    }

    if (item.type === "analyze") {
      setAnalyzeForm((prev) => ({
        ...prev,
        post: item.data?.improvedVersion || prev.post
      }));
      setTab("analyze");
    }

    setError("");
  }

  async function handleBuild() {
    if (!buildForm.topic.trim()) {
      setError(t.errorTopic);
      return;
    }

    startRequest();

    try {
      const response = await generatePost({
        ...buildForm,
        language
      });

      const nextResult = {
        type: "build",
        data: response && response.data ? response.data : {}
      };

      setResult(nextResult);
      addToHistory({
        type: nextResult.type,
        language,
        data: nextResult.data
      });
    } catch (err) {
      setError((err && err.message) || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleImprove() {
    if (!improveForm.post.trim()) {
      setError(t.errorPost);
      return;
    }

    startRequest();

    try {
      const response = await improvePost({
        ...improveForm,
        language
      });

      const nextResult = {
        type: "improve",
        data: response && response.data ? response.data : {}
      };

      setResult(nextResult);
      addToHistory({
        type: nextResult.type,
        language,
        data: nextResult.data
      });
    } catch (err) {
      setError((err && err.message) || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleAnalyze() {
    if (!analyzeForm.post.trim()) {
      setError(t.errorPost);
      return;
    }

    startRequest();

    try {
      const response = await analyzePost({
        ...analyzeForm,
        language
      });

      const nextResult = {
        type: "analyze",
        data: response && response.data ? response.data : {}
      };

      setResult(nextResult);
      addToHistory({
        type: nextResult.type,
        language,
        data: nextResult.data
      });
    } catch (err) {
      setError((err && err.message) || "Error");
    } finally {
      endRequest();
    }
  }

  const buildCopyText =
    result && result.type === "build"
      ? [
          result.data?.title || "",
          result.data?.hook || "",
          result.data?.body || "",
          result.data?.cta || "",
          Array.isArray(result.data?.hashtags)
            ? result.data.hashtags.join(" ")
            : "",
          result.data?.shortVersion || "",
          result.data?.alternativeVersion || ""
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

  const improveCopyText =
    result && result.type === "improve"
      ? [
          result.data?.improvedPost || "",
          result.data?.moreViralVersion || "",
          result.data?.moreAuthenticVersion || ""
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

  const analyzeCopyText =
    result && result.type === "analyze" ? result.data?.improvedVersion || "" : "";

  function getBuildResultFullPost() {
    if (!result || result.type !== "build" || !result.data) {
      return "";
    }

    return [
      result.data.title || "",
      result.data.hook || "",
      result.data.body || "",
      result.data.cta || ""
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  function getImprovePrimaryText() {
    if (!result || result.type !== "improve" || !result.data) {
      return "";
    }

    return safeText(result.data.improvedPost);
  }

  function getAnalyzeImprovedText() {
    if (!result || result.type !== "analyze" || !result.data) {
      return "";
    }

    return safeText(result.data.improvedVersion);
  }

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

app.get("/", (req, res) => {
  res.send("PostPulse API is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PostPulse API is running"
  });
});

app.post("/generate-post", async (req, res) => {
  try {
    const topic = cleanString(req.body?.topic);
    const targetAudience = cleanString(req.body?.targetAudience);
    const goal = cleanString(req.body?.goal);
    const style = normalizeStyle(req.body?.style);
    const platform = normalizePlatform(req.body?.platform);
    const language = normalizeLanguage(req.body?.language);

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const systemPrompt = `
You are a world-class social media content strategist.

You NEVER generate generic AI text.

You ALWAYS:
- think before writing
- build a strategic internal brief
- write like a real human
- optimize for engagement and platform behavior

You specialize in:
- viral hooks
- emotional storytelling
- clear value communication
- high-conversion CTAs
- platform-native writing

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

    if (!post) {
      return res.status(400).json({ error: "Post is required" });
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

You always improve content to feel:
- more human
- sharper
- less generic
- more engaging
- more platform-native

You specialize in:
- stronger hooks
- clearer messaging
- emotional improvement
- viral improvement
- authentic human tone

Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Original post: ${post}
Goal: ${goal || "Make it stronger"}
Style: ${style}
Platform: ${platform}
Language: ${getLanguageLabel(language)}

STEP 1 — Build an internal improvement brief silently:
- what is weak in the original post
- what should be preserved
- what should be improved first
- how to make it stronger for ${platform}
- how to make it sound less AI-generated

STEP 2 — Return JSON only:

{
  "strengths": [],
  "weaknesses": [],
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "tips": []
}

RULES:
- write only in ${getLanguageLabel(language)}
- strengths must be short and real
- weaknesses must be short and real
- improvedPost = best balanced improved version
- moreViralVersion = more attention-grabbing and engaging
- moreAuthenticVersion = more human, more natural, less robotic
- tips must be short and practical
- avoid generic AI phrases
- avoid cringe language
- adapt naturally to ${platform}
- platform guide: ${getPlatformGuide(platform, language)}
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
You are a world-class social media analyst and post critic.

You analyze realistically and strategically.
You do not flatter weak content.
You score based on actual performance potential.

You evaluate:
- hook strength
- clarity
- authenticity
- emotional impact
- curiosity
- CTA quality
- viral potential

You must give practical and platform-aware feedback.
Return valid JSON only.
`;

    const userPrompt = `
INPUT:
Post: ${post}
Platform: ${platform}
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

RULES:
- scores must be integers from 0 to 100
- write only in ${getLanguageLabel(language)}
- be honest, specific, and useful
- do not be generic
- "whatWorks" must mention real strengths only
- "whatHurts" must mention the real weaknesses
- "improvements" must be practical next steps
- "raiseViralScore" should focus on tension, shareability, stronger framing
- "raiseAuthenticityScore" should focus on human tone, natural wording, less robotic phrasing
- "raiseEmotionalScore" should focus on emotional connection, real feeling, stronger relevance
- "raiseCuriosityScore" should focus on open loops, intrigue, stronger reason to keep reading
- "improvedVersion" must be clearly stronger than the original
- adapt to ${platform}
- platform guide: ${getPlatformGuide(platform, language)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, buildAnalyzeFallback({ post, language, platform }));
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
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

  function moveBuildResultToAnalyze() {
    const fullPost = getBuildResultFullPost();

    setAnalyzeForm((prev) => ({
      ...prev,
      post: fullPost,
      platform: buildForm.platform
    }));

    setError("");
    setTab("analyze");
  }

  function moveImproveResultToAnalyze() {
    const improvedPost = getImprovePrimaryText();

    setAnalyzeForm((prev) => ({
      ...prev,
      post: improvedPost,
      platform: improveForm.platform
    }));

    setError("");
    setTab("analyze");
  }

 function moveAnalyzeImprovedToImprove(goalValue = "") {
  if (!result || result.type !== "analyze") return;

  const improvedVersion = result.data?.improvedVersion || "";

  const smartGoal =
    goalValue ||
    (language === "he"
      ? "שפר את הפוסט לפי הניתוח כדי להעלות ביצועים"
      : "Improve the post based on analysis to increase performance");

  setImproveForm((prev) => ({
    ...prev,
    post: improvedVersion,
    goal: smartGoal,
    platform: analyzeForm.platform
  }));

  setError("");
  setTab("improve");
} 

  const topicPlaceholder =
    language === "he" ? "על מה הפוסט?" : "What is the post about?";
  const audiencePlaceholder =
    language === "he" ? "למי הפוסט מיועד?" : "Who is this for?";
  const goalPlaceholder =
    language === "he" ? "מה המטרה?" : "What is the goal?";
  const improvePostPlaceholder =
    language === "he" ? "הדבק כאן את הפוסט לשיפור" : "Paste the post to improve";
  const improveGoalPlaceholder =
    language === "he" ? "מה לשפר?" : "What should improve?";
  const analyzePostPlaceholder =
    language === "he" ? "הדבק כאן את הפוסט לניתוח" : "Paste the post to analyze";

  return (
    <div className="app" dir={dir}>
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="app-shell">
        <header className="hero">
          <div className="hero-copy">
            <div className="hero-badge">AI Content Engine</div>
            <h1>{t.appName}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="lang-switch">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              {t.english}
            </button>
            <button
              type="button"
              className={language === "he" ? "active" : ""}
              onClick={() => setLanguage("he")}
            >
              {t.hebrew}
            </button>
          </div>
        </header>

        <nav className="tabs">
          <button
            type="button"
            className={tab === "build" ? "active" : ""}
            onClick={() => switchTab("build")}
          >
            {t.build}
          </button>
          <button
            type="button"
            className={tab === "improve" ? "active" : ""}
            onClick={() => switchTab("improve")}
          >
            {t.improve}
          </button>
          <button
            type="button"
            className={tab === "analyze" ? "active" : ""}
            onClick={() => switchTab("analyze")}
          >
            {t.analyze}
          </button>
        </nav>

        <main className="layout">
          <section className="panel glass">
            <div className="panel-title">
              {tab === "build" ? t.build : null}
              {tab === "improve" ? t.improve : null}
              {tab === "analyze" ? t.analyze : null}
            </div>

            {tab === "build" ? (
              <>
                <div className="field">
                  <label>{t.topic}</label>
                  <textarea
                    rows="5"
                    value={buildForm.topic}
                    onChange={(e) => setBuildField("topic", e.target.value)}
                    placeholder={topicPlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{t.targetAudience}</label>
                  <input
                    type="text"
                    value={buildForm.targetAudience}
                    onChange={(e) => setBuildField("targetAudience", e.target.value)}
                    placeholder={audiencePlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{t.goal}</label>
                  <input
                    type="text"
                    value={buildForm.goal}
                    onChange={(e) => setBuildField("goal", e.target.value)}
                    placeholder={goalPlaceholder}
                  />
                  <div className="preset-row">
                    {buildGoalPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`preset-chip ${buildForm.goal === preset ? "active" : ""}`}
                        onClick={() => setBuildField("goal", preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>{t.style}</label>
                    <select
                      value={buildForm.style}
                      onChange={(e) => setBuildField("style", e.target.value)}
                    >
                      {styleOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {language === "he" ? item.he : item.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>{t.platform}</label>
                    <select
                      value={buildForm.platform}
                      onChange={(e) => setBuildField("platform", e.target.value)}
                    >
                      {platformOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleBuild}
                  disabled={loading}
                >
                  {loading ? t.loading : t.generate}
                </button>
              </>
            ) : null}

            {tab === "improve" ? (
              <>
                <div className="field">
                  <label>{t.postText}</label>
                  <textarea
                    rows="10"
                    value={improveForm.post}
                    onChange={(e) => setImproveField("post", e.target.value)}
                    placeholder={improvePostPlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{t.goal}</label>
                  <input
                    type="text"
                    value={improveForm.goal}
                    onChange={(e) => setImproveField("goal", e.target.value)}
                    placeholder={improveGoalPlaceholder}
                  />
                  <div className="preset-row">
                    {improveGoalPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`preset-chip ${improveForm.goal === preset ? "active" : ""}`}
                        onClick={() => setImproveField("goal", preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>{t.style}</label>
                    <select
                      value={improveForm.style}
                      onChange={(e) => setImproveField("style", e.target.value)}
                    >
                      {styleOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {language === "he" ? item.he : item.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>{t.platform}</label>
                    <select
                      value={improveForm.platform}
                      onChange={(e) => setImproveField("platform", e.target.value)}
                    >
                      {platformOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleImprove}
                  disabled={loading}
                >
                  {loading ? t.loading : t.improveBtn}
                </button>
              </>
            ) : null}

            {tab === "analyze" ? (
              <>
                <div className="field">
                  <label>{t.postText}</label>
                  <textarea
                    rows="10"
                    value={analyzeForm.post}
                    onChange={(e) => setAnalyzeField("post", e.target.value)}
                    placeholder={analyzePostPlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{t.platform}</label>
                  <select
                    value={analyzeForm.platform}
                    onChange={(e) => setAnalyzeField("platform", e.target.value)}
                  >
                    {platformOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? t.loading : t.analyzeBtn}
                </button>
              </>
            ) : null}

            {error ? <div className="error-box">{error}</div> : null}
            {copyMessage ? <div className="success-box">{copyMessage}</div> : null}
          </section>

          <section className="panel glass">
            <div className="panel-title">{t.result}</div>

            {!result ? <div className="empty-state">{t.emptyState}</div> : null}

            {result ? (
              <div className="result-tools">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={saveCurrentResult}
                >
                  {t.saveToHistory}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={exportCurrentResult}
                >
                  {t.exportTxt}
                </button>
              </div>
            ) : null}

            {result && result.type === "build" ? (
              <div className="result-wrap">
                <Section
                  title={t.title}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.title || "")}
                >
                  <div className="text-card">{result.data?.title || ""}</div>
                </Section>

                <Section
                  title={t.hook}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.hook || "")}
                >
                  <div className="text-card">{result.data?.hook || ""}</div>
                </Section>

                <Section
                  title={t.body}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.body || "")}
                >
                  <div className="text-card">{result.data?.body || ""}</div>
                </Section>

                <Section
                  title={t.cta}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.cta || "")}
                >
                  <div className="text-card">{result.data?.cta || ""}</div>
                </Section>

                <Section
                  title={t.hashtags}
                  copyLabel={t.copy}
                  onCopy={() =>
                    copyText(
                      Array.isArray(result.data?.hashtags)
                        ? result.data.hashtags.join(" ")
                        : ""
                    )
                  }
                >
                  <div className="hashtags">
                    {Array.isArray(result.data?.hashtags)
                      ? result.data.hashtags.map((tag, index) => (
                          <span key={`${String(tag)}-${index}`}>
                            #{String(tag).replace(/^#/, "")}
                          </span>
                        ))
                      : null}
                  </div>
                </Section>

                <Section
                  title={t.shortVersion}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.shortVersion || "")}
                >
                  <div className="text-card">{result.data?.shortVersion || ""}</div>
                </Section>

                <Section
                  title={t.alternativeVersion}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.alternativeVersion || "")}
                >
                  <div className="text-card">
                    {result.data?.alternativeVersion || ""}
                  </div>
                </Section>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => copyText(buildCopyText)}
                >
                  {t.copyFullPost}
                </button>

                <div className="action-row">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => moveBuildResultToImprove("")}
                  >
                    {t.improveAction}
                  </button>

                  <button
                    type="button"
                    className="primary-btn primary-btn-viral"
                    onClick={() => moveBuildResultToImprove(t.goalPresetMoreViral)}
                  >
                    {t.viralBoost}
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={moveBuildResultToAnalyze}
                  >
                    {t.analyzeAction}
                  </button>
                </div>
              </div>
            ) : null}

            {result && result.type === "improve" ? (
              <div className="result-wrap">
                <Section title={t.strengths}>
                  <ListBlock items={result.data?.strengths || []} />
                </Section>

                <Section title={t.weaknesses}>
                  <ListBlock items={result.data?.weaknesses || []} />
                </Section>

                <Section
                  title={t.improvedVersion}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.improvedPost || "")}
                >
                  <div className="text-card">{result.data?.improvedPost || ""}</div>
                </Section>

                <Section
                  title={t.moreViralVersion}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.moreViralVersion || "")}
                >
                  <div className="text-card">
                    {result.data?.moreViralVersion || ""}
                  </div>
                </Section>

                <Section
                  title={t.moreAuthenticVersion}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data?.moreAuthenticVersion || "")}
                >
                  <div className="text-card">
                    {result.data?.moreAuthenticVersion || ""}
                  </div>
                </Section>

                <Section title={t.tips}>
                  <ListBlock items={result.data?.tips || []} />
                </Section>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => copyText(improveCopyText)}
                >
                  {t.copyImproved}
                </button>

                <div className="action-row action-row-single">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={moveImproveResultToAnalyze}
                  >
                    {analyzeFromImproveLabel}
                  </button>
                </div>
              </div>
            ) : null}

            {result && result.type === "analyze" ? (
              <div className="result-wrap">
                <div className="scores-grid">
                  <ScoreCard label={t.viralScore} value={result.data?.viralScore || 0} />
                  <ScoreCard
                    label={t.authenticityScore}
                    value={result.data?.authenticityScore || 0}
                  />
                  <ScoreCard label={t.clarityScore} value={result.data?.clarityScore || 0} />
                  <ScoreCard
                    label={t.emotionalScore}
                    value={result.data?.emotionalScore || 0}
                  />
                  <ScoreCard
                    label={t.curiosityScore}
                    value={result.data?.curiosityScore || 0}
                  />
                  <ScoreCard label={t.hookScore} value={result.data?.hookScore || 0} />
                  <ScoreCard label={t.ctaScore} value={result.data?.ctaScore || 0} />
                </div>

                {weakestArea ? (
                  <div className="smart-recommendation-box">
                    <div className="smart-recommendation-label">
                      {t.smartRecommendationTitle}
                    </div>
                    <div className="smart-recommendation-text">
                      {weakestArea.message}
                    </div>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => moveAnalyzeImprovedToImprove(weakestArea.goal)}
                    >
                      {weakestArea.actionLabel}
                    </button>
                  </div>
                ) : null}

                <Section title={t.summary}>
                  <div className="text-card">{result.data?.summary || ""}</div>
                </Section>

                <Section title={t.whatWorks}>
                  <ListBlock items={result.data?.whatWorks || []} />
                </Section>

                <Section title={t.whatHurts}>
                  <ListBlock items={result.data?.whatHurts || []} />
                </Section>

                <Section title={t.improvements}>
                  <ListBlock items={result.data?.improvements || []} />
                </Section>

                <Section title={t.raiseViralScore}>
                  <ListBlock items={result.data?.raiseViralScore || []} />
                </Section>

                <Section title={t.raiseAuthenticityScore}>
                  <ListBlock items={result.data?.raiseAuthenticityScore || []} />
                </Section>

                <Section title={t.raiseEmotionalScore}>
                  <ListBlock items={result.data?.raiseEmotionalScore || []} />
                </Section>

                <Section title={t.raiseCuriosityScore}>
                  <ListBlock items={result.data?.raiseCuriosityScore || []} />
                </Section>

                <Section
                  title={t.improvedVersion}
                  copyLabel={t.copy}
                  onCopy={() => copyText(analyzeCopyText)}
                >
                  <div className="text-card">{analyzeCopyText}</div>
                </Section>

                <div className="quick-actions-title">{t.quickActionsTitle}</div>
                <div className="quick-actions-grid">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => moveAnalyzeImprovedToImprove(t.goalPresetFixHook)}
                  >
                    {t.quickFixHook}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => moveAnalyzeImprovedToImprove(t.goalPresetFixCta)}
                  >
                    {t.quickFixCta}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => moveAnalyzeImprovedToImprove(t.goalPresetMoreViral)}
                  >
                    {t.quickMakeViral}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => moveAnalyzeImprovedToImprove(t.goalPresetMoreHuman)}
                  >
                    {t.quickMakeHuman}
                  </button>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => copyText(analyzeCopyText)}
                >
                  {t.copyAnalyze}
                </button>

                <div className="action-row">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => moveAnalyzeImprovedToImprove("")}
                  >
                    {improveFromAnalyzeLabel}
                  </button>

                  <button
                    type="button"
                    className="primary-btn primary-btn-viral"
                    onClick={() => moveAnalyzeImprovedToImprove(t.goalPresetMoreViral)}
                  >
                    {t.viralBoost}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </main>

        <section className="panel glass history-panel">
          <div className="history-header">
            <div className="panel-title">{t.historyTitle}</div>

            {history.length ? (
              <button type="button" className="danger-btn" onClick={clearHistory}>
                {t.clearHistory}
              </button>
            ) : null}
          </div>

          {!history.length ? (
            <div className="history-empty">{t.historyEmpty}</div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-top">
                    <div className="history-type">
                      {item.type === "build" ? t.build : null}
                      {item.type === "improve" ? t.improve : null}
                      {item.type === "analyze" ? t.analyze : null}
                    </div>
                    <div className="history-time">
                      {formatHistoryTime(item.createdAt, language)}
                    </div>
                  </div>

                  <div className="history-title">
                    {buildHistoryTitle(item, language)}
                  </div>

                  <div className="history-preview">
                    {buildHistoryPreview(item, language)}
                  </div>

                  <div className="history-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => loadHistoryItem(item)}
                    >
                      {t.loadHistory}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() =>
                        copyText(
                          buildHistoryPreview(item, language) ||
                            buildHistoryTitle(item, language)
                        )
                      }
                    >
                      {t.copy}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => exportHistoryItem(item)}
                    >
                      {t.exportTxt}
                    </button>

                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => removeHistoryItem(item.id)}
                    >
                      {t.deleteHistoryItem}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
