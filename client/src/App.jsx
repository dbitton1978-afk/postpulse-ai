import { useEffect, useMemo, useState } from "react";
import {
  analyzePost,
  deletePost,
  generatePost,
  getMyPosts,
  getStoredUser,
  hasToken,
  improvePost,
  loginUser,
  logoutUser,
  registerUser,
  savePost
} from "./api";
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

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function buildHistoryPreview(item, language) {
  const isHebrew = language === "he";

  if (item?.type === "build") {
    return (
      item?.data?.hook ||
      item?.data?.title ||
      (isHebrew ? "פוסט שנוצר" : "Generated post")
    );
  }

  if (item?.type === "improve") {
    return (
      item?.data?.improvedPost ||
      item?.data?.moreAuthenticVersion ||
      item?.data?.moreViralVersion ||
      (isHebrew ? "פוסט ששופר" : "Improved post")
    );
  }

  if (item?.type === "analyze") {
    return (
      item?.data?.summary ||
      item?.data?.improvedVersion ||
      (isHebrew ? "ניתוח פוסט" : "Post analysis")
    );
  }

  return "";
}

function buildHistoryTitle(item, language) {
  const isHebrew = language === "he";

  if (item?.type === "build") {
    return item?.data?.title || (isHebrew ? "פוסט שנוצר" : "Generated Post");
  }

  if (item?.type === "improve") {
    return isHebrew ? "פוסט משופר" : "Improved Post";
  }

  if (item?.type === "analyze") {
    return isHebrew ? "ניתוח פוסט" : "Post Analysis";
  }

  return isHebrew ? "פריט" : "Item";
}

function formatHistoryTime(value, language) {
  try {
    const locale = language === "he" ? "he-IL" : "en-US";
    return new Date(value).toLocaleString(locale, {
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

function buildPostFromGenerated(data) {
  return [data?.title, data?.hook, data?.body, data?.cta]
    .filter(Boolean)
    .join("\n\n");
}

function getImprovePrimaryText(data) {
  return (
    safeText(data?.improvedPost) ||
    safeText(data?.moreAuthenticVersion) ||
    safeText(data?.moreViralVersion)
  );
}

function getAnalyzePrimaryText(data) {
  return safeText(data?.improvedVersion);
}

export default function App() {
  const [language, setLanguage] = useState("he");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [deletingId, setDeletingId] = useState("");
  const [result, setResult] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(() => (hasToken() ? getStoredUser() : null));
  const [authForm, setAuthForm] = useState({
    email: "",
    password: ""
  });

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

  const isHebrew = language === "he";
  const dir = isHebrew ? "rtl" : "ltr";

  const historyItems = useMemo(() => {
    if (historyFilter === "all") return history;
    return history.filter((item) => item.type === historyFilter);
  }, [history, historyFilter]);

  useEffect(() => {
    if (hasToken() && !user) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && hasToken()) {
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    if (!copyMessage && !successMessage) return;

    const timer = window.setTimeout(() => {
      setCopyMessage("");
      setSuccessMessage("");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [copyMessage, successMessage]);

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopyMessage(isHebrew ? "הועתק" : "Copied");
    } catch {
      setCopyMessage(isHebrew ? "ההעתקה נכשלה" : "Copy failed");
    }
  }

  async function loadHistory() {
    if (!hasToken()) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await getMyPosts();
      setHistory(Array.isArray(response?.posts) ? response.posts : []);
    } catch (err) {
      setHistoryError(
        err?.message || (isHebrew ? "שגיאה בטעינת היסטוריה" : "Failed to load history")
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function persistHistoryItem(type, input, data) {
    if (!hasToken()) return;

    try {
      const response = await savePost({
        type,
        language,
        input,
        data
      });

      if (response?.post) {
        setHistory((prev) => [response.post, ...prev].slice(0, 100));
      } else {
        await loadHistory();
      }
    } catch (err) {
      console.error("Save history failed", err);
    }
  }

  function setBuildField(field, value) {
    setBuildForm((prev) => ({ ...prev, [field]: value }));
  }

  function setImproveField(field, value) {
    setImproveForm((prev) => ({ ...prev, [field]: value }));
  }

  function setAnalyzeField(field, value) {
    setAnalyzeForm((prev) => ({ ...prev, [field]: value }));
  }

  function setAuthField(field, value) {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAuthSubmit() {
    setAuthLoading(true);
    setAuthError("");

    try {
      const payload = {
        email: authForm.email.trim(),
        password: authForm.password
      };

      const response =
        authMode === "login"
          ? await loginUser(payload)
          : await registerUser(payload);

      setUser(response?.user || getStoredUser());
      setSuccessMessage(
        authMode === "login"
          ? isHebrew
            ? "התחברת בהצלחה"
            : "Logged in successfully"
          : isHebrew
            ? "נרשמת בהצלחה"
            : "Registered successfully"
      );
    } catch (err) {
      setAuthError(err?.message || (isHebrew ? "שגיאת התחברות" : "Authentication failed"));
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
    setHistory([]);
    setResult(null);
    setSuccessMessage(isHebrew ? "התנתקת" : "Logged out");
  }

  async function handleBuild() {
    setError("");
    setResult(null);

    if (!buildForm.topic.trim()) {
      setError(isHebrew ? "יש להזין נושא לפוסט" : "Please enter a topic");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        topic: buildForm.topic.trim(),
        targetAudience: buildForm.targetAudience.trim(),
        goal: buildForm.goal.trim(),
        style: buildForm.style,
        platform: buildForm.platform,
        language
      };

      const response = await generatePost(payload);

      const nextResult = {
        type: "build",
        data: response?.data || {}
      };

      setResult(nextResult);
      await persistHistoryItem("build", payload, nextResult.data);
    } catch (err) {
      setError(err?.message || (isHebrew ? "יצירת הפוסט נכשלה" : "Generate failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    setError("");
    setResult(null);

    const postValue = (improveForm.post || "").trim();

    if (!postValue) {
      setError(isHebrew ? "יש להזין טקסט לפוסט" : "Please enter post text");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        post: postValue,
        goal: improveForm.goal.trim(),
        style: improveForm.style,
        platform: improveForm.platform,
        language
      };

      const response = await improvePost(payload);

      const nextResult = {
        type: "improve",
        data: response?.data || {}
      };

      setResult(nextResult);
      await persistHistoryItem("improve", payload, nextResult.data);
    } catch (err) {
      setError(err?.message || (isHebrew ? "שיפור הפוסט נכשל" : "Improve failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    setError("");
    setResult(null);

    const postValue = (analyzeForm.post || "").trim();

    if (!postValue) {
      setError(isHebrew ? "יש להזין טקסט לפוסט" : "Please enter post text");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        post: postValue,
        platform: analyzeForm.platform,
        language
      };

      const response = await analyzePost(payload);

      const nextResult = {
        type: "analyze",
        data: response?.data || {}
      };

      setResult(nextResult);
      await persistHistoryItem("analyze", payload, nextResult.data);
    } catch (err) {
      setError(err?.message || (isHebrew ? "ניתוח הפוסט נכשל" : "Analyze failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteHistory(itemId) {
    if (!itemId) return;

    setDeletingId(itemId);
    setHistoryError("");

    try {
      await deletePost(itemId);
      setHistory((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      setHistoryError(err?.message || (isHebrew ? "מחיקה נכשלה" : "Delete failed"));
    } finally {
      setDeletingId("");
    }
  }

  function handleLoadFromHistory(item) {
    if (!item) return;

    const input = item.input || {};
    const data = item.data || {};

    if (item.type === "build") {
      setBuildForm({
        topic: safeText(input.topic),
        targetAudience: safeText(input.targetAudience),
        goal: safeText(input.goal),
        style: safeText(input.style) || "professional",
        platform: safeText(input.platform) || "instagram"
      });
      setResult({ type: "build", data });
      setTab("build");
      return;
    }

    if (item.type === "improve") {
      setImproveForm({
        post: safeText(input.post) || getImprovePrimaryText(data),
        goal: safeText(input.goal),
        style: safeText(input.style) || "professional",
        platform: safeText(input.platform) || "instagram"
      });
      setResult({ type: "improve", data });
      setTab("improve");
      return;
    }

    if (item.type === "analyze") {
      setAnalyzeForm({
        post: safeText(input.post) || getAnalyzePrimaryText(data),
        platform: safeText(input.platform) || "instagram"
      });
      setResult({ type: "analyze", data });
      setTab("analyze");
    }
  }

  function moveBuildToImprove() {
    if (result?.type !== "build") return;

    setImproveForm((prev) => ({
      ...prev,
      post: buildPostFromGenerated(result.data),
      platform: buildForm.platform || prev.platform
    }));

    setTab("improve");
  }

  function moveImproveToAnalyze() {
    if (result?.type !== "improve") return;

    setAnalyzeForm((prev) => ({
      ...prev,
      post: getImprovePrimaryText(result.data),
      platform: improveForm.platform || prev.platform
    }));

    setTab("analyze");
  }

  if (!user || !hasToken()) {
    return (
      <div className="app-shell" dir={dir}>
        <div className="app-bg" />
        <div className="app-container">
          <section className="panel glass" style={{ maxWidth: 520, margin: "60px auto" }}>
            <h1 style={{ marginTop: 0 }}>PostPulse AI</h1>
            <p style={{ color: "#9fb0cd", marginBottom: 24 }}>
              {isHebrew ? "התחבר או הירשם כדי לעבוד עם המערכת" : "Log in or register to use the system"}
            </p>

            <div className="tabs">
              <button
                type="button"
                className={`tab-btn ${authMode === "login" ? "active" : ""}`}
                onClick={() => setAuthMode("login")}
              >
                {isHebrew ? "התחברות" : "Login"}
              </button>
              <button
                type="button"
                className={`tab-btn ${authMode === "register" ? "active" : ""}`}
                onClick={() => setAuthMode("register")}
              >
                {isHebrew ? "הרשמה" : "Register"}
              </button>
              <button
                type="button"
                className={`tab-btn ${language === "he" ? "active" : ""}`}
                onClick={() => setLanguage("he")}
              >
                עברית
              </button>
              <button
                type="button"
                className={`tab-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
            </div>

            <div className="field">
              <label>{isHebrew ? "אימייל" : "Email"}</label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthField("email", e.target.value)}
              />
            </div>

            <div className="field">
              <label>{isHebrew ? "סיסמה" : "Password"}</label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthField("password", e.target.value)}
              />
            </div>

            <button className="primary-btn" onClick={handleAuthSubmit} disabled={authLoading}>
              {authLoading
                ? isHebrew
                  ? "טוען..."
                  : "Loading..."
                : authMode === "login"
                  ? isHebrew
                    ? "התחבר"
                    : "Login"
                  : isHebrew
                    ? "הירשם"
                    : "Register"}
            </button>

            {authError ? <div className="error-box">{authError}</div> : null}
            {successMessage ? <div className="success-box">{successMessage}</div> : null}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" dir={dir}>
      <div className="app-bg" />
      <div className="app-container">
        <header className="topbar glass">
          <div>
            <h1>PostPulse AI</h1>
            <p>{isHebrew ? "בנה, שפר ונתח פוסטים" : "Build, improve and analyze posts"}</p>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className={`tab-btn ${language === "he" ? "active" : ""}`}
              onClick={() => setLanguage("he")}
            >
              עברית
            </button>
            <button
              type="button"
              className={`tab-btn ${language === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
            <button type="button" className="secondary-btn" onClick={handleLogout}>
              {isHebrew ? "התנתק" : "Logout"}
            </button>
          </div>
        </header>

        {user?.email ? (
          <div className="panel glass" style={{ marginBottom: 24 }}>
            <strong>{isHebrew ? "משתמש:" : "User:"}</strong> {user.email}
          </div>
        ) : null}

        <div className="main-grid">
          <section className="panel glass">
            <div className="tabs">
              <button
                type="button"
                className={`tab-btn ${tab === "build" ? "active" : ""}`}
                onClick={() => setTab("build")}
              >
                Build
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === "improve" ? "active" : ""}`}
                onClick={() => setTab("improve")}
              >
                Improve
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === "analyze" ? "active" : ""}`}
                onClick={() => setTab("analyze")}
              >
                Analyze
              </button>
            </div>

            {tab === "build" ? (
              <>
                <div className="field">
                  <label>{isHebrew ? "נושא / רעיון" : "Topic / Idea"}</label>
                  <input
                    value={buildForm.topic}
                    onChange={(e) => setBuildField("topic", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>{isHebrew ? "קהל יעד" : "Target Audience"}</label>
                  <input
                    value={buildForm.targetAudience}
                    onChange={(e) => setBuildField("targetAudience", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>{isHebrew ? "מטרה" : "Goal"}</label>
                  <input
                    value={buildForm.goal}
                    onChange={(e) => setBuildField("goal", e.target.value)}
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>{isHebrew ? "סגנון" : "Style"}</label>
                    <select
                      value={buildForm.style}
                      onChange={(e) => setBuildField("style", e.target.value)}
                    >
                      {styleOptions.map((style) => (
                        <option key={style.value} value={style.value}>
                          {isHebrew ? style.he : style.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>{isHebrew ? "פלטפורמה" : "Platform"}</label>
                    <select
                      value={buildForm.platform}
                      onChange={(e) => setBuildField("platform", e.target.value)}
                    >
                      {platformOptions.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                          {platform.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="primary-btn" onClick={handleBuild} disabled={loading}>
                  {loading ? (isHebrew ? "טוען..." : "Loading...") : isHebrew ? "צור פוסט" : "Generate Post"}
                </button>
              </>
            ) : null}

            {tab === "improve" ? (
              <>
                <div className="field">
                  <label>{isHebrew ? "טקסט הפוסט" : "Post Text"}</label>
                  <textarea
                    rows={8}
                    value={improveForm.post}
                    onChange={(e) => setImproveField("post", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>{isHebrew ? "מטרה" : "Goal"}</label>
                  <input
                    value={improveForm.goal}
                    onChange={(e) => setImproveField("goal", e.target.value)}
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>{isHebrew ? "סגנון" : "Style"}</label>
                    <select
                      value={improveForm.style}
                      onChange={(e) => setImproveField("style", e.target.value)}
                    >
                      {styleOptions.map((style) => (
                        <option key={style.value} value={style.value}>
                          {isHebrew ? style.he : style.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>{isHebrew ? "פלטפורמה" : "Platform"}</label>
                    <select
                      value={improveForm.platform}
                      onChange={(e) => setImproveField("platform", e.target.value)}
                    >
                      {platformOptions.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                          {platform.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="primary-btn" onClick={handleImprove} disabled={loading}>
                  {loading ? (isHebrew ? "טוען..." : "Loading...") : isHebrew ? "שפר פוסט" : "Improve Post"}
                </button>
              </>
            ) : null}

            {tab === "analyze" ? (
              <>
                <div className="field">
                  <label>{isHebrew ? "טקסט הפוסט" : "Post Text"}</label>
                  <textarea
                    rows={8}
                    value={analyzeForm.post}
                    onChange={(e) => setAnalyzeField("post", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>{isHebrew ? "פלטפורמה" : "Platform"}</label>
                  <select
                    value={analyzeForm.platform}
                    onChange={(e) => setAnalyzeField("platform", e.target.value)}
                  >
                    {platformOptions.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="primary-btn" onClick={handleAnalyze} disabled={loading}>
                  {loading ? (isHebrew ? "טוען..." : "Loading...") : isHebrew ? "נתח פוסט" : "Analyze Post"}
                </button>
              </>
            ) : null}

            {error ? <div className="error-box">{error}</div> : null}
            {copyMessage ? <div className="success-box">{copyMessage}</div> : null}
            {successMessage ? <div className="success-box">{successMessage}</div> : null}
          </section>

          <section className="panel glass">
            <h2 style={{ marginTop: 0 }}>{isHebrew ? "תוצאה" : "Result"}</h2>

            {!result ? (
              <div className="empty-state">
                {isHebrew ? "עדיין אין תוצאה" : "No result yet"}
              </div>
            ) : null}

            {result?.type === "build" ? (
              <div className="result-wrap">
                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "כותרת" : "Title"}</h3>
                    <button type="button" className="copy-btn" onClick={() => copyText(result.data?.title || "")}>
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.title || ""}</div>
                </div>

                <div className="result-section">
                  <div className="section-header">
                    <h3>Hook</h3>
                    <button type="button" className="copy-btn" onClick={() => copyText(result.data?.hook || "")}>
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.hook || ""}</div>
                </div>

                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "גוף הפוסט" : "Body"}</h3>
                    <button type="button" className="copy-btn" onClick={() => copyText(result.data?.body || "")}>
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.body || ""}</div>
                </div>

                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "קריאה לפעולה" : "CTA"}</h3>
                    <button type="button" className="copy-btn" onClick={() => copyText(result.data?.cta || "")}>
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.cta || ""}</div>
                </div>

                <button type="button" className="secondary-btn" onClick={moveBuildToImprove}>
                  {isHebrew ? "העבר ל־Improve" : "Move to Improve"}
                </button>
              </div>
            ) : null}

            {result?.type === "improve" ? (
              <div className="result-wrap">
                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "גרסה משופרת" : "Improved Version"}</h3>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText(getImprovePrimaryText(result.data))}
                    >
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{getImprovePrimaryText(result.data)}</div>
                </div>

                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "גרסה ויראלית יותר" : "More Viral Version"}</h3>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText(result.data?.moreViralVersion || "")}
                    >
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.moreViralVersion || ""}</div>
                </div>

                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "גרסה אנושית יותר" : "More Authentic Version"}</h3>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText(result.data?.moreAuthenticVersion || "")}
                    >
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.moreAuthenticVersion || ""}</div>
                </div>

                <button type="button" className="secondary-btn" onClick={moveImproveToAnalyze}>
                  {isHebrew ? "נתח את הגרסה המשופרת" : "Analyze improved version"}
                </button>
              </div>
            ) : null}

            {result?.type === "analyze" ? (
              <div className="result-wrap">
                <div className="scores-grid">
                  {[
                    { label: isHebrew ? "ויראליות" : "Viral", value: result.data?.viralScore },
                    { label: isHebrew ? "אותנטיות" : "Authenticity", value: result.data?.authenticityScore },
                    { label: isHebrew ? "בהירות" : "Clarity", value: result.data?.clarityScore },
                    { label: isHebrew ? "רגש" : "Emotion", value: result.data?.emotionalScore },
                    { label: isHebrew ? "סקרנות" : "Curiosity", value: result.data?.curiosityScore },
                    { label: "Hook", value: result.data?.hookScore },
                    { label: "CTA", value: result.data?.ctaScore }
                  ].map((item) => (
                    <div key={item.label} className="score-card">
                      <div className="score-value">{Number(item.value || 0)}%</div>
                      <div className="score-label">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "סיכום" : "Summary"}</h3>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText(result.data?.summary || "")}
                    >
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.summary || ""}</div>
                </div>

                <div className="result-section">
                  <div className="section-header">
                    <h3>{isHebrew ? "גרסה משופרת" : "Improved Version"}</h3>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText(result.data?.improvedVersion || "")}
                    >
                      {isHebrew ? "העתק" : "Copy"}
                    </button>
                  </div>
                  <div className="text-card">{result.data?.improvedVersion || ""}</div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <section className="panel glass history-panel">
          <div className="history-header">
            <div>
              <h2 style={{ margin: 0 }}>{isHebrew ? "היסטוריה" : "History"}</h2>
              <p style={{ margin: "6px 0 0", color: "#9fb0cd" }}>
                {isHebrew ? "מחיקה, טעינה מחדש וסינון" : "Delete, reload and filter"}
              </p>
            </div>

            <div className="history-actions">
              <select
                className="history-filter"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
              >
                <option value="all">{isHebrew ? "הכל" : "All"}</option>
                <option value="build">Build</option>
                <option value="improve">Improve</option>
                <option value="analyze">Analyze</option>
              </select>

              <button className="secondary-btn" onClick={loadHistory} disabled={historyLoading}>
                {historyLoading ? (isHebrew ? "טוען..." : "Loading...") : isHebrew ? "רענן" : "Refresh"}
              </button>
            </div>
          </div>

          {historyError ? <div className="error-box">{historyError}</div> : null}

          {!historyLoading && historyItems.length === 0 ? (
            <div className="empty-state">
              {isHebrew ? "אין פריטים בהיסטוריה" : "No history items"}
            </div>
          ) : null}

          <div className="history-list">
            {historyItems.map((item) => (
              <article key={item._id} className="history-item">
                <div className="history-item-top">
                  <div>
                    <h3>{buildHistoryTitle(item, language)}</h3>
                    <div className="history-meta">
                      <span className={`history-badge history-${item.type}`}>{item.type}</span>
                      <span>{formatHistoryTime(item.createdAt, language)}</span>
                    </div>
                  </div>

                  <div className="history-buttons">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleLoadFromHistory(item)}
                    >
                      {isHebrew ? "טען" : "Load"}
                    </button>

                    <button
                      type="button"
                      className="danger-btn"
                      disabled={deletingId === item._id}
                      onClick={() => handleDeleteHistory(item._id)}
                    >
                      {deletingId === item._id
                        ? isHebrew
                          ? "מוחק..."
                          : "Deleting..."
                        : isHebrew
                          ? "מחק"
                          : "Delete"}
                    </button>
                  </div>
                </div>

                <p className="history-preview">{buildHistoryPreview(item, language)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
