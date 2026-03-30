import { useEffect, useMemo, useState } from "react";
import {
  analyzePost,
  generatePost,
  improvePost,
  loadMyPosts,
  savePost,
  logoutUser,
  getStoredUser
} from "./api";
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
      item.data.moreAuthenticVersion ||
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

function getPrimaryImproveText(data) {
  if (!data) return "";
  return (
    safeText(data.improvedPost) ||
    safeText(data.moreAuthenticVersion) ||
    safeText(data.moreViralVersion)
  );
}

function getPrimaryAnalyzeText(data) {
  if (!data) return "";
  return safeText(data.improvedVersion);
}

function buildPostFromBuildResult(data) {
  if (!data) return "";
  return [data.title || "", data.hook || "", data.body || "", data.cta || ""]
    .filter(Boolean)
    .join("\n\n");
}

function normalizeServerHistory(posts) {
  if (!Array.isArray(posts)) return [];

  return posts.map((post) => ({
    id: post._id || post.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: post.createdAt || new Date().toISOString(),
    type: post.type || "build",
    language: post.content?.language || "en",
    data: post.content || {}
  }));
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [currentPost, setCurrentPost] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const user = getStoredUser();
  const t = useMemo(() => translations?.[language] || {}, [language]);
  const dir = language === "he" ? "rtl" : "ltr";
  const isHebrew = language === "he";

  function tr(key, fallback) {
    return t?.[key] || fallback;
  }

  const copyLabel = isHebrew ? "העתק" : "Copy";
  const copiedLabel = isHebrew ? "הועתק" : "Copied";

  const buildGoalPresets = useMemo(
    () => [
      tr("goalPresetViral", isHebrew ? "פוסט ויראלי" : "More viral"),
      tr("goalPresetHuman", isHebrew ? "נשמע אנושי" : "More human"),
      tr("goalPresetProfessional", isHebrew ? "מקצועי" : "Professional"),
      tr("goalPresetEmotional", isHebrew ? "רגשי" : "Emotional"),
      tr("goalPresetSales", isHebrew ? "מכירה" : "Sales"),
      tr("goalPresetEngagement", isHebrew ? "מעורבות" : "Engagement")
    ],
    [language, t]
  );

  const improveGoalPresets = useMemo(
    () => [
      tr("goalPresetMoreViral", isHebrew ? "יותר ויראלי" : "More viral"),
      tr("goalPresetMoreHuman", isHebrew ? "יותר אנושי" : "More human"),
      tr("goalPresetMoreClear", isHebrew ? "יותר ברור" : "More clear"),
      tr("goalPresetMoreEmotional", isHebrew ? "יותר רגשי" : "More emotional"),
      tr("goalPresetMoreSharp", isHebrew ? "יותר חד" : "Sharper"),
      tr("goalPresetMoreProfessional", isHebrew ? "יותר מקצועי" : "More professional"),
      tr("goalPresetFixHook", isHebrew ? "שפר Hook" : "Fix hook"),
      tr("goalPresetFixCta", isHebrew ? "שפר CTA" : "Fix CTA"),
      tr("goalPresetMoreCurious", isHebrew ? "יותר מסקרן" : "More curiosity")
    ],
    [language, t]
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
    async function fetchHistory() {
      setHistoryLoading(true);

      try {
        const response = await loadMyPosts();
        const posts = normalizeServerHistory(response?.posts);
        setHistory(posts);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setHistoryLoading(false);
      }
    }

    fetchHistory();
  }, []);

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
      setTimeout(() => setCopyMessage(""), 1800);
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

  async function syncServerHistory() {
    try {
      const response = await loadMyPosts();
      const posts = normalizeServerHistory(response?.posts);
      setHistory(posts);
    } catch (err) {
      console.error("History sync failed", err);
    }
  }

  async function saveResultManually(type, data) {
    try {
      await savePost({
        type,
        content: {
          ...data,
          language,
          platform:
            type === "build"
              ? buildForm.platform
              : type === "improve"
                ? improveForm.platform
                : analyzeForm.platform
        }
      });
    } catch (err) {
      console.error("Manual save failed", err);
    }
  }

  function removeHistoryItem(id) {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  function loadHistoryItem(item) {
    if (!item) return;

    const nextResult = {
      type: item.type,
      data: item.data
    };

    setResult(nextResult);
    setError("");

    if (item.type === "build") {
      const loadedPost = buildPostFromBuildResult(item.data);

      setCurrentPost(loadedPost);
      setAnalysisResult(null);

      setImproveForm((prev) => ({
        ...prev,
        post: loadedPost || prev.post,
        goal: tr("goalPresetMoreHuman", isHebrew ? "יותר אנושי" : "More human"),
        style: buildForm.style,
        platform: buildForm.platform
      }));

      setAnalyzeForm((prev) => ({
        ...prev,
        post: loadedPost || prev.post,
        platform: buildForm.platform
      }));

      setTab("build");
      return;
    }

    if (item.type === "improve") {
      const improvedText = getPrimaryImproveText(item.data);

      setCurrentPost(improvedText);
      setAnalysisResult(null);

      setImproveForm((prev) => ({
        ...prev,
        post: improvedText || prev.post
      }));

      setAnalyzeForm((prev) => ({
        ...prev,
        post: improvedText || prev.post,
        platform: improveForm.platform || prev.platform
      }));

      setTab("improve");
      return;
    }

    if (item.type === "analyze") {
      const loadedAnalysis = item.data || null;
      const analyzedText =
        getPrimaryAnalyzeText(loadedAnalysis) ||
        analyzeForm.post ||
        currentPost ||
        "";

      setAnalysisResult(loadedAnalysis);
      setCurrentPost(analyzedText);

      setAnalyzeForm((prev) => ({
        ...prev,
        post: analyzedText || prev.post
      }));

      setImproveForm((prev) => ({
        ...prev,
        post: analyzedText || prev.post,
        goal: prev.goal || tr("goalPresetMoreHuman", isHebrew ? "יותר אנושי" : "More human"),
        platform: analyzeForm.platform || prev.platform || "instagram"
      }));

      setTab("analyze");
    }
  }

  async function handleBuild() {
    if (!buildForm.topic.trim()) {
      setError(tr("errorTopic", isHebrew ? "נדרש נושא" : "Topic is required"));
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
        data: response?.data || {}
      };

      const generatedPost = buildPostFromBuildResult(nextResult.data);

      setCurrentPost(generatedPost);
      setAnalysisResult(null);

      setImproveForm((prev) => ({
        ...prev,
        post: generatedPost,
        goal: prev.goal || tr("goalPresetMoreHuman", isHebrew ? "יותר אנושי" : "More human"),
        style: buildForm.style,
        platform: buildForm.platform
      }));

      setAnalyzeForm((prev) => ({
        ...prev,
        post: generatedPost,
        platform: buildForm.platform
      }));

      setResult(nextResult);
      await saveResultManually("build", nextResult.data);
      await syncServerHistory();
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleImprove() {
    const postToImprove = improveForm.post.trim() || currentPost.trim();

    if (!postToImprove) {
      setError(tr("errorPost", isHebrew ? "נדרש טקסט פוסט" : "Post text is required"));
      return;
    }

    startRequest();

    try {
      const response = await improvePost({
        ...improveForm,
        post: postToImprove,
        language
      });

      const nextResult = {
        type: "improve",
        data: response?.data || {}
      };

      const improvedPost = getPrimaryImproveText(nextResult.data);

      setCurrentPost(improvedPost);
      setAnalysisResult(null);

      setAnalyzeForm((prev) => ({
        ...prev,
        post: improvedPost,
        platform: improveForm.platform
      }));

      setResult(nextResult);
      await saveResultManually("improve", nextResult.data);
      await syncServerHistory();
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleAnalyze() {
    const postToAnalyze = analyzeForm.post.trim() || currentPost.trim();

    if (!postToAnalyze) {
      setError(tr("errorPost", isHebrew ? "נדרש טקסט פוסט" : "Post text is required"));
      return;
    }

    startRequest();

    try {
      const response = await analyzePost({
        ...analyzeForm,
        post: postToAnalyze,
        language
      });

      const nextResult = {
        type: "analyze",
        data: response?.data || {}
      };

      setAnalysisResult(nextResult.data);
      setResult(nextResult);
      await saveResultManually("analyze", nextResult.data);
      await syncServerHistory();
    } catch (err) {
      setError(err?.message || "Error");
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
          getPrimaryImproveText(result.data),
          result.data?.moreViralVersion || "",
          result.data?.moreAuthenticVersion || ""
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

  const analyzeCopyText =
    result && result.type === "analyze" ? getPrimaryAnalyzeText(result.data) : "";

  function moveBuildResultToImprove() {
    if (!result || result.type !== "build") return;

    const fullPost = buildPostFromBuildResult(result.data);

    setCurrentPost(fullPost);

    setImproveForm((prev) => ({
      ...prev,
      post: fullPost,
      goal:
        tr("goalPresetMoreHuman", isHebrew ? "יותר אנושי" : "More human") ||
        prev.goal,
      style: buildForm.style,
      platform: buildForm.platform
    }));

    setError("");
    setTab("improve");
  }

  function moveBuildResultToAnalyze() {
    if (!result || result.type !== "build") return;

    const fullPost = buildPostFromBuildResult(result.data);

    setCurrentPost(fullPost);

    setAnalyzeForm((prev) => ({
      ...prev,
      post: fullPost,
      platform: buildForm.platform
    }));

    setError("");
    setTab("analyze");
  }

  function moveImproveResultToAnalyze() {
    const improveData =
      result && result.type === "improve" ? result.data : null;

    const improvedPost =
      getPrimaryImproveText(improveData) ||
      improveForm.post ||
      currentPost ||
      "";

    if (!improvedPost.trim()) {
      setError(tr("errorPost", isHebrew ? "נדרש טקסט פוסט" : "Post text is required"));
      return;
    }

    setCurrentPost(improvedPost);

    setAnalyzeForm((prev) => ({
      ...prev,
      post: improvedPost,
      platform: improveForm.platform || prev.platform || "instagram"
    }));

    setError("");
    setTab("analyze");
  }

  function moveAnalyzeResultToImprove() {
    const nextPost =
      getPrimaryAnalyzeText(analysisResult) ||
      analyzeForm.post ||
      currentPost ||
      "";

    if (!nextPost.trim()) {
      setError(tr("errorPost", isHebrew ? "נדרש טקסט פוסט" : "Post text is required"));
      return;
    }

    setError("");
    setCurrentPost(nextPost);

    setImproveForm((prev) => ({
      ...prev,
      post: nextPost,
      goal: prev.goal || tr("goalPresetMoreHuman", isHebrew ? "יותר אנושי" : "More human"),
      platform: analyzeForm.platform || prev.platform || "instagram"
    }));

    setTab("improve");
  }

  const activeAnalyzeData =
    result && result.type === "analyze" ? result.data : analysisResult;

  const topicPlaceholder = isHebrew ? "על מה הפוסט?" : "What is the post about?";
  const audiencePlaceholder = isHebrew ? "למי הפוסט מיועד?" : "Who is this for?";
  const goalPlaceholder = isHebrew ? "מה המטרה?" : "What is the goal?";
  const improvePostPlaceholder =
    isHebrew ? "הדבק כאן את הפוסט לשיפור" : "Paste the post to improve";
  const improveGoalPlaceholder =
    isHebrew ? "מה לשפר?" : "What should improve?";
  const analyzePostPlaceholder =
    isHebrew ? "הדבק כאן את הפוסט לניתוח" : "Paste the post to analyze";

  return (
    <div className="app" dir={dir}>
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="app-shell">
        <header className="hero glass">
          <div className="hero-copy">
            <div className="hero-badge">AI Content Engine</div>
            <h1>{tr("appName", "PostPulse AI")}</h1>
            <p>
              {tr(
                "subtitle",
                "Build, improve, and analyze social media posts with a premium workflow"
              )}
            </p>
            {user?.email ? <span className="hero-user">{user.email}</span> : null}
          </div>

          <div className="lang-switch">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              {tr("english", "EN")}
            </button>
            <button
              type="button"
              className={language === "he" ? "active" : ""}
              onClick={() => setLanguage("he")}
            >
              {tr("hebrew", "HE")}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                logoutUser();
                window.location.reload();
              }}
            >
              {isHebrew ? "התנתק" : "Logout"}
            </button>
          </div>
        </header>

        <nav className="tabs glass">
          <button
            type="button"
            className={tab === "build" ? "active" : ""}
            onClick={() => switchTab("build")}
          >
            {tr("build", "Build")}
          </button>
          <button
            type="button"
            className={tab === "improve" ? "active" : ""}
            onClick={() => switchTab("improve")}
          >
            {tr("improve", "Improve")}
          </button>
          <button
            type="button"
            className={tab === "analyze" ? "active" : ""}
            onClick={() => switchTab("analyze")}
          >
            {tr("analyze", "Analyze")}
          </button>
        </nav>

        <main className="layout">
          <section className="panel glass">
            <div className="panel-title">
              {tab === "build" ? tr("build", "Build") : null}
              {tab === "improve" ? tr("improve", "Improve") : null}
              {tab === "analyze" ? tr("analyze", "Analyze") : null}
            </div>

            {tab === "build" ? (
              <>
                <div className="field">
                  <label>{tr("topic", "Topic / Idea")}</label>
                  <textarea
                    rows="5"
                    value={buildForm.topic}
                    onChange={(e) => setBuildField("topic", e.target.value)}
                    placeholder={topicPlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{tr("targetAudience", "Target Audience")}</label>
                  <input
                    type="text"
                    value={buildForm.targetAudience}
                    onChange={(e) => setBuildField("targetAudience", e.target.value)}
                    placeholder={audiencePlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{tr("goal", "Goal")}</label>
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
                    <label>{tr("style", "Style")}</label>
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
                    <label>{tr("platform", "Platform")}</label>
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
                  {loading ? tr("loading", "Loading...") : tr("generate", "Generate")}
                </button>
              </>
            ) : null}

            {tab === "improve" ? (
              <>
                <div className="field">
                  <label>{tr("postText", "Post Text")}</label>
                  <textarea
                    rows="10"
                    value={improveForm.post}
                    onChange={(e) => setImproveField("post", e.target.value)}
                    placeholder={improvePostPlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{tr("goal", "Goal")}</label>
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
                    <label>{tr("style", "Style")}</label>
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
                    <label>{tr("platform", "Platform")}</label>
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
                  {loading ? tr("loading", "Loading...") : tr("improveBtn", "Improve")}
                </button>
              </>
            ) : null}

            {tab === "analyze" ? (
              <>
                <div className="field">
                  <label>{tr("postText", "Post Text")}</label>
                  <textarea
                    rows="10"
                    value={analyzeForm.post}
                    onChange={(e) => setAnalyzeField("post", e.target.value)}
                    placeholder={analyzePostPlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{tr("platform", "Platform")}</label>
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
                  {loading ? tr("loading", "Loading...") : tr("analyzeBtn", "Analyze")}
                </button>
              </>
            ) : null}

            {error ? <div className="error-box">{error}</div> : null}
            {copyMessage ? <div className="success-box">{copyMessage}</div> : null}
          </section>

          <section className="panel glass">
            <div className="panel-title">{tr("result", "Result")}</div>

            {!result ? (
              <div className="empty-state">
                {tr("emptyState", isHebrew ? "עדיין אין תוצאה" : "No result yet")}
              </div>
            ) : null}

            {result ? (
              <>
                <div className="result-tools">
                  {result.type === "build" ? (
                    <>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => copyText(buildCopyText)}
                      >
                        {copyLabel}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={moveBuildResultToImprove}
                      >
                        {tr("improveBtn", "Improve")}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={moveBuildResultToAnalyze}
                      >
                        {tr("analyzeBtn", "Analyze")}
                      </button>
                    </>
                  ) : null}

                  {result.type === "improve" ? (
                    <>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => copyText(improveCopyText)}
                      >
                        {copyLabel}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={moveImproveResultToAnalyze}
                      >
                        {isHebrew ? "נתח את הגרסה המשופרת" : "Analyze Improved Version"}
                      </button>
                    </>
                  ) : null}

                  {result.type === "analyze" ? (
                    <>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => copyText(analyzeCopyText)}
                      >
                        {copyLabel}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={moveAnalyzeResultToImprove}
                      >
                        {isHebrew ? "העבר חזרה ל־Improve" : "Move Back to Improve"}
                      </button>
                    </>
                  ) : null}
                </div>

                {result.type === "build" ? (
                  <>
                    <Section
                      title={tr("title", "Title")}
                      onCopy={() => copyText(result.data?.title || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.title || ""}</p>
                    </Section>

                    <Section
                      title={tr("hook", "Hook")}
                      onCopy={() => copyText(result.data?.hook || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.hook || ""}</p>
                    </Section>

                    <Section
                      title={tr("body", "Body")}
                      onCopy={() => copyText(result.data?.body || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.body || ""}</p>
                    </Section>

                    <Section
                      title={tr("cta", "CTA")}
                      onCopy={() => copyText(result.data?.cta || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.cta || ""}</p>
                    </Section>

                    <Section
                      title={tr("hashtags", "Hashtags")}
                      onCopy={() =>
                        copyText(
                          Array.isArray(result.data?.hashtags)
                            ? result.data.hashtags.join(" ")
                            : ""
                        )
                      }
                      copyLabel={copyLabel}
                    >
                      <p>
                        {Array.isArray(result.data?.hashtags)
                          ? result.data.hashtags.join(" ")
                          : ""}
                      </p>
                    </Section>

                    <Section
                      title={tr("shortVersion", "Short Version")}
                      onCopy={() => copyText(result.data?.shortVersion || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.shortVersion || ""}</p>
                    </Section>

                    <Section
                      title={tr("alternativeVersion", "Alternative Version")}
                      onCopy={() => copyText(result.data?.alternativeVersion || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.alternativeVersion || ""}</p>
                    </Section>
                  </>
                ) : null}

                {result.type === "improve" ? (
                  <>
                    <Section title={tr("strengths", "Strengths")}>
                      <ListBlock items={result.data?.strengths} />
                    </Section>

                    <Section title={tr("weaknesses", "Weaknesses")}>
                      <ListBlock items={result.data?.weaknesses} />
                    </Section>

                    <Section
                      title={tr("improvedVersion", "Improved Version")}
                      onCopy={() => copyText(getPrimaryImproveText(result.data))}
                      copyLabel={copyLabel}
                    >
                      <p>{getPrimaryImproveText(result.data)}</p>
                    </Section>

                    <Section
                      title={tr("moreViralVersion", "More Viral Version")}
                      onCopy={() => copyText(result.data?.moreViralVersion || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.moreViralVersion || ""}</p>
                    </Section>

                    <Section
                      title={tr("moreAuthenticVersion", "More Authentic Version")}
                      onCopy={() => copyText(result.data?.moreAuthenticVersion || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{result.data?.moreAuthenticVersion || ""}</p>
                    </Section>

                    <Section title={tr("tips", "Tips")}>
                      <ListBlock items={result.data?.tips} />
                    </Section>
                  </>
                ) : null}

                {result.type === "analyze" ? (
                  <>
                    <div className="scores-grid">
                      <ScoreCard label={tr("viralScore", "Viral")} value={activeAnalyzeData?.viralScore} />
                      <ScoreCard
                        label={tr("authenticityScore", "Authenticity")}
                        value={activeAnalyzeData?.authenticityScore}
                      />
                      <ScoreCard
                        label={tr("clarityScore", "Clarity")}
                        value={activeAnalyzeData?.clarityScore}
                      />
                      <ScoreCard
                        label={tr("emotionalScore", "Emotional")}
                        value={activeAnalyzeData?.emotionalScore}
                      />
                      <ScoreCard
                        label={tr("curiosityScore", "Curiosity")}
                        value={activeAnalyzeData?.curiosityScore}
                      />
                      <ScoreCard label={tr("hookScore", "Hook")} value={activeAnalyzeData?.hookScore} />
                      <ScoreCard label={tr("ctaScore", "CTA")} value={activeAnalyzeData?.ctaScore} />
                    </div>

                    <Section title={tr("summary", "Summary")}>
                      <p>{activeAnalyzeData?.summary || ""}</p>
                    </Section>

                    <Section title={tr("whatWorks", "What Works")}>
                      <ListBlock items={activeAnalyzeData?.whatWorks} />
                    </Section>

                    <Section title={tr("whatHurts", "What Hurts")}>
                      <ListBlock items={activeAnalyzeData?.whatHurts} />
                    </Section>

                    <Section title={tr("improvements", "Improvements")}>
                      <ListBlock items={activeAnalyzeData?.improvements} />
                    </Section>

                    <Section title={tr("raiseViralScore", "Raise Viral Score")}>
                      <ListBlock items={activeAnalyzeData?.raiseViralScore} />
                    </Section>

                    <Section title={tr("raiseAuthenticityScore", "Raise Authenticity Score")}>
                      <ListBlock items={activeAnalyzeData?.raiseAuthenticityScore} />
                    </Section>

                    <Section title={tr("raiseEmotionalScore", "Raise Emotional Score")}>
                      <ListBlock items={activeAnalyzeData?.raiseEmotionalScore} />
                    </Section>

                    <Section title={tr("raiseCuriosityScore", "Raise Curiosity Score")}>
                      <ListBlock items={activeAnalyzeData?.raiseCuriosityScore} />
                    </Section>

                    <Section
                      title={tr("improvedVersion", "Improved Version")}
                      onCopy={() => copyText(activeAnalyzeData?.improvedVersion || "")}
                      copyLabel={copyLabel}
                    >
                      <p>{activeAnalyzeData?.improvedVersion || ""}</p>
                    </Section>
                  </>
                ) : null}
              </>
            ) : null}
          </section>

          <section className="panel glass history-panel">
            <div className="panel-title">{isHebrew ? "היסטוריה" : "History"}</div>

            {historyLoading ? (
              <div className="empty-state">
                {isHebrew ? "טוען היסטוריה..." : "Loading history..."}
              </div>
            ) : null}

            {!historyLoading && history.length === 0 ? (
              <div className="empty-state">
                {isHebrew ? "עדיין אין היסטוריה" : "No history yet"}
              </div>
            ) : null}

            {!historyLoading && history.length > 0 ? (
              <>
                <div className="history-tools">
                  <button type="button" className="secondary-btn" onClick={clearHistory}>
                    {isHebrew ? "נקה תצוגה" : "Clear View"}
                  </button>
                </div>

                <div className="history-list">
                  {history.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-item-head">
                        <div>
                          <strong>{buildHistoryTitle(item, language)}</strong>
                          <div className="history-time">
                            {formatHistoryTime(item.createdAt, language)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => removeHistoryItem(item.id)}
                        >
                          ×
                        </button>
                      </div>

                      <p className="history-preview">
                        {buildHistoryPreview(item, language)}
                      </p>

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => loadHistoryItem(item)}
                      >
                        {isHebrew ? "טען" : "Load"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
