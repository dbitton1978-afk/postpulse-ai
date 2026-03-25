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

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function mapRecommendationToGoal(text, t) {
  if (!text) return t.goalPresetMoreHuman;

  const lower = text.toLowerCase();

  if (lower.includes("hook")) return t.goalPresetFixHook;
  if (lower.includes("cta")) return t.goalPresetFixCta;
  if (lower.includes("engagement")) return t.goalPresetMoreViral;
  if (lower.includes("emotional")) return t.goalPresetMoreEmotional;
  if (lower.includes("clarity")) return t.goalPresetMoreClear;
  if (lower.includes("authentic")) return t.goalPresetMoreHuman;
  if (lower.includes("curiosity")) return t.goalPresetMoreCurious;
  if (lower.includes("generic")) return t.goalPresetMoreHuman;

  return t.goalPresetMoreHuman;
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [currentPost, setCurrentPost] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  const t = useMemo(() => translations[language], [language]);

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

  function startRequest() {
    setError("");
    setResult(null);
    setLoading(true);
  }

  function endRequest() {
    setLoading(false);
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

      const data = response?.data || {};

      const fullPost = [
        data.title,
        data.hook,
        data.body,
        data.cta
      ]
        .filter(Boolean)
        .join("\n\n");

      setCurrentPost(fullPost);

      setImproveForm((prev) => ({
        ...prev,
        post: fullPost,
        goal: t.goalPresetMoreHuman,
        platform: buildForm.platform
      }));

      setAnalyzeForm((prev) => ({
        ...prev,
        post: fullPost,
        platform: buildForm.platform
      }));

      setResult({ type: "build", data });
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleImprove() {
    const postToUse = improveForm.post || currentPost;

    if (!postToUse.trim()) {
      setError(t.errorPost);
      return;
    }

    startRequest();

    try {
      const response = await improvePost({
        ...improveForm,
        post: postToUse,
        language
      });

      const data = response?.data || {};
      const improved = safeText(data.improvedPost);

      setCurrentPost(improved);

      setAnalyzeForm((prev) => ({
        ...prev,
        post: improved,
        platform: improveForm.platform
      }));

      setResult({ type: "improve", data });
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleAnalyze() {
    const postToUse = analyzeForm.post || currentPost;

    if (!postToUse.trim()) {
      setError(t.errorPost);
      return;
    }

    startRequest();

    try {
      const response = await analyzePost({
        ...analyzeForm,
        post: postToUse,
        language
      });

      const data = response?.data || {};

      setAnalysisResult(data);

      setResult({ type: "analyze", data });
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      endRequest();
    }
  }

  function moveAnalyzeToImproveAuto() {
    if (!analysisResult) return;

    const weakestText =
      analysisResult.summary ||
      (analysisResult.improvements || []).join(" ") ||
      "";

    const goal = mapRecommendationToGoal(weakestText, t);

    const improved =
      analysisResult.improvedVersion || currentPost;

    setImproveForm((prev) => ({
      ...prev,
      post: improved,
      goal,
      platform: analyzeForm.platform
    }));

    setTab("improve");
  }

  return (
    <div className="app">
      {/* UI נשאר ללא שינוי */}
    </div>
  );
}
