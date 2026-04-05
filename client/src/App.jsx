import { useEffect, useMemo, useState } from "react";
import {
  generatePost,
  improvePost,
  loginUser,
  registerUser,
  getStoredUser,
  logoutUser,
  savePost,
  getMyPosts,
  deletePost
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

function buildGeneratedPost(data) {
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

function formatHistoryDate(value, locale) {
  try {
    return new Date(value).toLocaleString(locale);
  } catch {
    return "";
  }
}

function getHistoryPreview(item, language) {
  const isHebrew = language === "he";

  if (item?.type === "build") {
    return (
      safeText(item?.data?.title) ||
      safeText(item?.data?.hook) ||
      (isHebrew ? "פוסט שנוצר" : "Generated post")
    );
  }

  if (item?.type === "improve") {
    return (
      getImprovePrimaryText(item?.data) ||
      (isHebrew ? "פוסט ששופר" : "Improved post")
    );
  }

  return "";
}

function getHistoryTitle(item, language) {
  const isHebrew = language === "he";

  if (item?.type === "build") {
    return isHebrew ? "פוסט שנוצר" : "Generated Post";
  }

  if (item?.type === "improve") {
    return isHebrew ? "פוסט משופר" : "Improved Post";
  }

  return isHebrew ? "פריט" : "Item";
}

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({
    email: "",
    password: ""
  });
  const [authLoading, setAuthLoading] = useState(false);

  const [language, setLanguage] = useState("he");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const isHebrew = language === "he";
  const dir = isHebrew ? "rtl" : "ltr";
  const locale = isHebrew ? "he-IL" : "en-US";

  const t = useMemo(
    () => ({
      login: isHebrew ? "התחברות" : "Login",
      register: isHebrew ? "הרשמה" : "Register",
      email: isHebrew ? "אימייל" : "Email",
      password: isHebrew ? "סיסמה" : "Password",
      logout: isHebrew ? "התנתק" : "Logout",
      noAccount: isHebrew ? "אין חשבון? הירשם" : "No account? Register",
      haveAccount: isHebrew ? "יש חשבון? התחבר" : "Already have an account? Login",
      authSubtitle: isHebrew
        ? "התחבר או הירשם כדי להשתמש ב־PostPulse AI"
        : "Log in or register to use PostPulse AI",
      authFailed: isHebrew ? "שגיאת התחברות" : "Authentication failed",
      missingAuthFields: isHebrew ? "יש למלא אימייל וסיסמה" : "Email and password are required",

      build: isHebrew ? "יצירה" : "Build",
      improve: isHebrew ? "שיפור" : "Improve",

      topic: isHebrew ? "נושא / רעיון" : "Topic / Idea",
      targetAudience: isHebrew ? "קהל יעד" : "Target Audience",
      goal: isHebrew ? "מטרה" : "Goal",
      style: isHebrew ? "סגנון" : "Style",
      platform: isHebrew ? "פלטפורמה" : "Platform",
      postText: isHebrew ? "טקסט הפוסט" : "Post Text",

      generate: isHebrew ? "צור פוסט" : "Generate Post",
      improveBtn: isHebrew ? "שפר פוסט" : "Improve Post",
      loading: isHebrew ? "טוען..." : "Loading...",

      result: isHebrew ? "תוצאה" : "Result",
      title: isHebrew ? "כותרת" : "Title",
      hook: isHebrew ? "פתיח" : "Hook",
      body: isHebrew ? "גוף הפוסט" : "Body",
      cta: isHebrew ? "קריאה לפעולה" : "CTA",
      hashtags: isHebrew ? "האשטגים" : "Hashtags",
      shortVersion: isHebrew ? "גרסה קצרה" : "Short Version",
      alternativeVersion: isHebrew ? "גרסה חלופית" : "Alternative Version",

      strengths: isHebrew ? "חוזקות" : "Strengths",
      weaknesses: isHebrew ? "חולשות" : "Weaknesses",
      improvedVersion: isHebrew ? "גרסה משופרת" : "Improved Version",
      moreViralVersion: isHebrew ? "גרסה ויראלית יותר" : "More Viral Version",
      moreAuthenticVersion: isHebrew ? "גרסה אנושית יותר" : "More Authentic Version",
      tips: isHebrew ? "טיפים" : "Tips",

      noResultYet: isHebrew ? "עדיין אין תוצאה להצגה" : "No result yet",
      enterTopic: isHebrew ? "יש להזין נושא לפוסט" : "Please enter a topic",
      enterPostText: isHebrew ? "יש להזין טקסט לפוסט" : "Please enter post text",
      generateFailed: isHebrew ? "יצירת הפוסט נכשלה" : "Generate failed",
      improveFailed: isHebrew ? "שיפור הפוסט נכשל" : "Improve failed",
      copied: isHebrew ? "הועתק" : "Copied",
      copyFailed: isHebrew ? "ההעתקה נכשלה" : "Copy failed",
      copy: isHebrew ? "העתק" : "Copy",
      saved: isHebrew ? "נשמר בהיסטוריה" : "Saved to history",
      deleted: isHebrew ? "נמחק מההיסטוריה" : "Deleted from history",

      moveToImprove: isHebrew ? "העבר לשיפור" : "Move to Improve",

      appSubtitle: isHebrew ? "בנה ושפר פוסטים" : "Build and improve posts",
      topicPlaceholder: isHebrew ? "על מה הפוסט?" : "What is the post about?",
      audiencePlaceholder: isHebrew ? "למי הפוסט מיועד?" : "Who is the audience?",
      goalPlaceholder: isHebrew ? "מה המטרה?" : "What is the goal?",
      userLabel: isHebrew ? "מחובר כ:" : "Signed in as:",
      history: isHebrew ? "היסטוריה" : "History",
      noHistory: isHebrew ? "עדיין אין פריטים בהיסטוריה" : "No history items yet",
      loadHistoryFailed: isHebrew ? "טעינת היסטוריה נכשלה" : "Failed to load history",
      openSavedItem: isHebrew ? "טען" : "Load",
      invalidHistoryType: isHebrew ? "סוג היסטוריה לא תקין" : "Invalid history type",
      historySaveFailed: isHebrew ? "שמירה להיסטוריה נכשלה" : "History save failed",
      refreshHistory: isHebrew ? "רענן היסטוריה" : "Refresh History",
      delete: isHebrew ? "מחק" : "Delete",
      deleteFailed: isHebrew ? "מחיקה נכשלה" : "Delete failed"
    }),
    [isHebrew]
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

  useEffect(() => {
    if (!copyMessage) return;
    const timer = window.setTimeout(() => setCopyMessage(""), 1800);
    return () => window.clearTimeout(timer);
  }, [copyMessage]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    loadHistory();
  }, [user]);

  async function loadHistory() {
    setHistoryLoading(true);
    setError("");

    try {
      const response = await getMyPosts();
      const items = Array.isArray(response?.posts) ? response.posts : [];
      setHistory(items.filter((item) => item?.type === "build" || item?.type === "improve"));
    } catch (err) {
      setError(err?.message || t.loadHistoryFailed);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function saveBuildHistory(input, data) {
  try {
    const response = await savePost({
      type: "build",
      language,
      input,
      data
    });

    if (response?.post) {
      setHistory((prev) => [response.post, ...prev].slice(0, 100));
      setCopyMessage(t.saved);
      return;
    }

    setError(t.historySaveFailed);
  } catch (err) {
    setError(err?.message || t.historySaveFailed);
  }
}

async function saveImproveHistory(input, data) {
  try {
    const response = await savePost({
      type: "improve",
      language,
      input,
      data
    });

    if (response?.post) {
      setHistory((prev) => [response.post, ...prev].slice(0, 100));
      setCopyMessage(t.saved);
      return;
    }

    setError(t.historySaveFailed);
  } catch (err) {
    setError(err?.message || t.historySaveFailed);
  }
}

  async function handleDeleteHistoryItem(postId) {
    if (!postId) return;

    setDeletingId(postId);
    setError("");

    try {
      await deletePost(postId);
      setHistory((prev) => prev.filter((item) => item._id !== postId));
      setCopyMessage(t.deleted);

      if (result && history.find((item) => item._id === postId)) {
        // no-op for now, keep current result visible
      }
    } catch (err) {
      setError(err?.message || t.deleteFailed);
    } finally {
      setDeletingId("");
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopyMessage(t.copied);
    } catch {
      setCopyMessage(t.copyFailed);
    }
  }

  function setBuildField(field, value) {
    setBuildForm((prev) => ({ ...prev, [field]: value }));
  }

  function setImproveField(field, value) {
    setImproveForm((prev) => ({ ...prev, [field]: value }));
  }

  function setAuthField(field, value) {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAuthSubmit() {
    setError("");

    const email = safeText(authForm.email).trim();
    const password = safeText(authForm.password).trim();

    if (!email || !password) {
      setError(t.missingAuthFields);
      return;
    }

    setAuthLoading(true);

    try {
      const action = isLoginMode ? loginUser : registerUser;
      const response = await action({ email, password });
      setUser(response?.user || getStoredUser());
      setAuthForm({ email: "", password: "" });
    } catch (err) {
      setError(err?.message || t.authFailed);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
    setError("");
    setResult(null);
    setHistory([]);
  }

  async function handleBuild() {
    setError("");
    setResult(null);

    const topicValue = (buildForm.topic || "").trim();

    if (!topicValue) {
      setError(t.enterTopic);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        topic: topicValue,
        targetAudience: (buildForm.targetAudience || "").trim(),
        goal: (buildForm.goal || "").trim(),
        style: buildForm.style || "professional",
        platform: buildForm.platform || "instagram",
        language
      };

      const response = await generatePost(payload);
      const data = response?.data || {};

      setResult({
        type: "build",
        data
      });

     await saveBuildHistory(payload, data);
    } catch (err) {
      setError(err?.message || t.generateFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    setError("");
    setResult(null);

    const postValue = (improveForm.post || "").trim();

    if (!postValue) {
      setError(t.enterPostText);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        post: postValue,
        goal: (improveForm.goal || "").trim(),
        style: improveForm.style || "professional",
        platform: improveForm.platform || "instagram",
        language
      };

      const response = await improvePost(payload);
      const data = response?.data || {};

      setResult({
        type: "improve",
        data
      });

    await saveImproveHistory(payload, data); 
    } catch (err) {
      setError(err?.message || t.improveFailed);
    } finally {
      setLoading(false);
    }
  }

  function moveBuildToImprove() {
    if (result?.type !== "build") return;

    setImproveForm((prev) => ({
      ...prev,
      post: buildGeneratedPost(result.data),
      platform: buildForm.platform || prev.platform
    }));

    setTab("improve");
  }

  function loadHistoryItem(item) {
    if (!item) return;

    if (item.type === "build") {
      setTab("build");
      setBuildForm({
        topic: safeText(item.input?.topic),
        targetAudience: safeText(item.input?.targetAudience),
        goal: safeText(item.input?.goal),
        style: safeText(item.input?.style) || "professional",
        platform: safeText(item.input?.platform) || "instagram"
      });
      setResult({ type: "build", data: item.data || {} });
      return;
    }

    if (item.type === "improve") {
      setTab("improve");
      setImproveForm({
        post: safeText(item.input?.post),
        goal: safeText(item.input?.goal),
        style: safeText(item.input?.style) || "professional",
        platform: safeText(item.input?.platform) || "instagram"
      });
      setResult({ type: "improve", data: item.data || {} });
    }
  }

  if (!user) {
    return (
      <div className="app-shell" dir={dir}>
        <div className="app-bg" />

        <div className="app-container">
          <section className="panel glass" style={{ maxWidth: 520, margin: "60px auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ margin: 0 }}>PostPulse AI</h1>
              <p style={{ marginTop: 10, color: "#9fb0cd" }}>{t.authSubtitle}</p>
            </div>

            <div className="topbar-actions" style={{ marginBottom: 18 }}>
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

            <div className="tabs" style={{ marginBottom: 18 }}>
              <button
                type="button"
                className={`tab-btn ${isLoginMode ? "active" : ""}`}
                onClick={() => setIsLoginMode(true)}
              >
                {t.login}
              </button>
              <button
                type="button"
                className={`tab-btn ${!isLoginMode ? "active" : ""}`}
                onClick={() => setIsLoginMode(false)}
              >
                {t.register}
              </button>
            </div>

            <div className="field">
              <label>{t.email}</label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthField("email", e.target.value)}
                placeholder={t.email}
              />
            </div>

            <div className="field">
              <label>{t.password}</label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthField("password", e.target.value)}
                placeholder={t.password}
              />
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={handleAuthSubmit}
              disabled={authLoading}
            >
              {authLoading ? t.loading : isLoginMode ? t.login : t.register}
            </button>

            <button
              type="button"
              className="secondary-btn"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => setIsLoginMode((prev) => !prev)}
            >
              {isLoginMode ? t.noAccount : t.haveAccount}
            </button>

            {error ? <div className="error-box">{error}</div> : null}
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
            <p>{t.appSubtitle}</p>
          </div>

          <div className="topbar-actions" style={{ flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ color: "#cfd9ee", fontSize: 14, padding: "0 8px" }}>
              <strong>{t.userLabel}</strong> {user.email}
            </div>

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
              {t.logout}
            </button>
          </div>
        </header>

        <div className="main-grid">
          <section className="panel glass">
            <div className="tabs">
              <button
                type="button"
                className={`tab-btn ${tab === "build" ? "active" : ""}`}
                onClick={() => setTab("build")}
              >
                {t.build}
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === "improve" ? "active" : ""}`}
                onClick={() => setTab("improve")}
              >
                {t.improve}
              </button>
            </div>

            {tab === "build" && (
              <>
                <div className="field">
                  <label>{t.topic}</label>
                  <input
                    value={buildForm.topic}
                    onChange={(e) => setBuildField("topic", e.target.value)}
                    placeholder={t.topicPlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{t.targetAudience}</label>
                  <input
                    value={buildForm.targetAudience}
                    onChange={(e) => setBuildField("targetAudience", e.target.value)}
                    placeholder={t.audiencePlaceholder}
                  />
                </div>

                <div className="field">
                  <label>{t.goal}</label>
                  <input
                    value={buildForm.goal}
                    onChange={(e) => setBuildField("goal", e.target.value)}
                    placeholder={t.goalPlaceholder}
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>{t.style}</label>
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
                    <label>{t.platform}</label>
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

                <button type="button" className="primary-btn" onClick={handleBuild} disabled={loading}>
                  {loading ? t.loading : t.generate}
                </button>
              </>
            )}

            {tab === "improve" && (
              <>
                <div className="field">
                  <label>{t.postText}</label>
                  <textarea
                    rows={8}
                    value={improveForm.post}
                    onChange={(e) => setImproveField("post", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>{t.goal}</label>
                  <input
                    value={improveForm.goal}
                    onChange={(e) => setImproveField("goal", e.target.value)}
                    placeholder={t.goalPlaceholder}
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>{t.style}</label>
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
                    <label>{t.platform}</label>
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

                <button type="button" className="primary-btn" onClick={handleImprove} disabled={loading}>
                  {loading ? t.loading : t.improveBtn}
                </button>
              </>
            )}

            {error ? <div className="error-box">{error}</div> : null}
            {copyMessage ? <div className="success-box">{copyMessage}</div> : null}
          </section>

          <section className="panel glass">
            <h2>{t.result}</h2>

            {!result && <div className="empty-state">{t.noResultYet}</div>}

            {result?.type === "build" && (
              <div className="result-wrap">
                <Section title={t.title} onCopy={() => copyText(result.data?.title || "")} copyLabel={t.copy}>
                  <div className="text-card">{result.data?.title || ""}</div>
                </Section>

                <Section title={t.hook} onCopy={() => copyText(result.data?.hook || "")} copyLabel={t.copy}>
                  <div className="text-card">{result.data?.hook || ""}</div>
                </Section>

                <Section title={t.body} onCopy={() => copyText(result.data?.body || "")} copyLabel={t.copy}>
                  <div className="text-card">{result.data?.body || ""}</div>
                </Section>

                <Section title={t.cta} onCopy={() => copyText(result.data?.cta || "")} copyLabel={t.copy}>
                  <div className="text-card">{result.data?.cta || ""}</div>
                </Section>

                <Section
                  title={t.hashtags}
                  onCopy={() => copyText((result.data?.hashtags || []).join(" "))}
                  copyLabel={t.copy}
                >
                  <div className="hashtags">
                    {(result.data?.hashtags || []).map((tag, index) => (
                      <span key={`${tag}-${index}`}>{tag}</span>
                    ))}
                  </div>
                </Section>

                <Section
                  title={t.shortVersion}
                  onCopy={() => copyText(result.data?.shortVersion || "")}
                  copyLabel={t.copy}
                >
                  <div className="text-card">{result.data?.shortVersion || ""}</div>
                </Section>

                <Section
                  title={t.alternativeVersion}
                  onCopy={() => copyText(result.data?.alternativeVersion || "")}
                  copyLabel={t.copy}
                >
                  <div className="text-card">{result.data?.alternativeVersion || ""}</div>
                </Section>

                <button type="button" className="secondary-btn" onClick={moveBuildToImprove}>
                  {t.moveToImprove}
                </button>
              </div>
            )}

            {result?.type === "improve" && (
              <div className="result-wrap">
                <Section title={t.strengths}>
                  <ListBlock items={result.data?.strengths || []} />
                </Section>

                <Section title={t.weaknesses}>
                  <ListBlock items={result.data?.weaknesses || []} />
                </Section>

                <Section
                  title={t.improvedVersion}
                  onCopy={() => copyText(getImprovePrimaryText(result.data))}
                  copyLabel={t.copy}
                >
                  <div className="text-card">{getImprovePrimaryText(result.data)}</div>
                </Section>

                <Section
                  title={t.moreViralVersion}
                  onCopy={() => copyText(result.data?.moreViralVersion || "")}
                  copyLabel={t.copy}
                >
                  <div className="text-card">{result.data?.moreViralVersion || ""}</div>
                </Section>

                <Section
                  title={t.moreAuthenticVersion}
                  onCopy={() => copyText(result.data?.moreAuthenticVersion || "")}
                  copyLabel={t.copy}
                >
                  <div className="text-card">{result.data?.moreAuthenticVersion || ""}</div>
                </Section>

                <Section title={t.tips}>
                  <ListBlock items={result.data?.tips || []} />
                </Section>
              </div>
            )}
          </section>
        </div>

        <section className="panel glass" style={{ marginTop: 24 }}>
          <div className="section-header">
            <h2 style={{ margin: 0 }}>{t.history}</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {historyLoading ? <span style={{ color: "#9fb0cd" }}>{t.loading}</span> : null}
              <button type="button" className="copy-btn" onClick={loadHistory}>
                {t.refreshHistory}
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="empty-state">{t.noHistory}</div>
          ) : (
            <div className="result-wrap">
              {history.map((item) => (
                <div key={item._id} className="result-section">
                  <div className="section-header">
                    <div>
                      <h3 style={{ margin: 0 }}>{getHistoryTitle(item, language)}</h3>
                      <div style={{ color: "#9fb0cd", fontSize: 13, marginTop: 6 }}>
                        {formatHistoryDate(item.createdAt, locale)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => loadHistoryItem(item)}
                      >
                        {t.openSavedItem}
                      </button>

                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleDeleteHistoryItem(item._id)}
                        disabled={deletingId === item._id}
                      >
                        {deletingId === item._id ? t.loading : t.delete}
                      </button>
                    </div>
                  </div>

                  <div className="text-card">{getHistoryPreview(item, language)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
