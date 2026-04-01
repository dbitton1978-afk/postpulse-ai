import { useEffect, useMemo, useState } from "react";
import {
  analyzePost,
  deletePost,
  generatePost,
  getMyPosts,
  improvePost,
  savePost
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

export default function App() {
  const [language, setLanguage] = useState("he");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [history, setHistory] = useState([]);

  const t = useMemo(() => translations[language], [language]);
  const dir = language === "he" ? "rtl" : "ltr";
  const isHebrew = language === "he";

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

  const historyItems = useMemo(() => {
    if (historyFilter === "all") return history;
    return history.filter((item) => item.type === historyFilter);
  }, [history, historyFilter]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!copyMessage) return;

    const timeout = window.setTimeout(() => {
      setCopyMessage("");
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copyMessage]);

  async function loadHistory() {
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

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopyMessage(isHebrew ? "הועתק" : "Copied");
    } catch {
      setCopyMessage(isHebrew ? "ההעתקה נכשלה" : "Copy failed");
    }
  }

  function startRequest() {
    setError("");
    setResult(null);
    setLoading(true);
  }

  function endRequest() {
    setLoading(false);
  }

  async function persistHistoryItem(type, input, data) {
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

  async function handleBuild() {
    if (!buildForm.topic.trim()) {
      setError(isHebrew ? "יש להזין נושא לפוסט" : "Please enter a topic");
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

      setResult(nextResult);

      await persistHistoryItem("build", buildForm, nextResult.data);
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleImprove() {
    if (!improveForm.post.trim()) {
      setError(isHebrew ? "יש להזין טקסט לפוסט" : "Please enter post text");
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
        data: response?.data || {}
      };

      setResult(nextResult);

      await persistHistoryItem("improve", improveForm, nextResult.data);
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleAnalyze() {
    if (!analyzeForm.post.trim()) {
      setError(isHebrew ? "יש להזין טקסט לפוסט" : "Please enter post text");
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
        data: response?.data || {}
      };

      setResult(nextResult);

      await persistHistoryItem("analyze", analyzeForm, nextResult.data);
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      endRequest();
    }
  }

  async function handleDeleteHistoryItem(itemId) {
    if (!itemId) return;

    setDeletingId(itemId);
    setHistoryError("");

    try {
      await deletePost(itemId);
      setHistory((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      setHistoryError(
        err?.message || (isHebrew ? "מחיקת הפריט נכשלה" : "Delete failed")
      );
    } finally {
      setDeletingId("");
    }
  }

  function handleLoadFromHistory(item) {
    if (!item) return;

    const safeInput = item.input || {};
    const safeData = item.data || {};

    if (item.type === "build") {
      setBuildForm({
        topic: safeText(safeInput.topic),
        targetAudience: safeText(safeInput.targetAudience),
        goal: safeText(safeInput.goal),
        style: safeText(safeInput.style) || "professional",
        platform: safeText(safeInput.platform) || "instagram"
      });
      setTab("build");
      setResult({
        type: "build",
        data: safeData
      });
      return;
    }

    if (item.type === "improve") {
      setImproveForm({
        post: safeText(safeInput.post) || getPrimaryImproveText(safeData),
        goal: safeText(safeInput.goal),
        style: safeText(safeInput.style) || "professional",
        platform: safeText(safeInput.platform) || "instagram"
      });
      setTab("improve");
      setResult({
        type: "improve",
        data: safeData
      });
      return;
    }

    if (item.type === "analyze") {
      setAnalyzeForm({
        post: safeText(safeInput.post) || getPrimaryAnalyzeText(safeData),
        platform: safeText(safeInput.platform) || "instagram"
      });
      setTab("analyze");
      setResult({
        type: "analyze",
        data: safeData
      });
    }
  }

  function moveBuildToImprove() {
    if (result?.type !== "build") return;
    const builtPost = buildPostFromBuildResult(result.data);

    setImproveForm((prev) => ({
      ...prev,
      post: builtPost,
      platform: buildForm.platform || prev.platform
    }));

    setTab("improve");
  }

  function moveImproveToAnalyze() {
    if (result?.type !== "improve") return;
    const improvedPost = getPrimaryImproveText(result.data);

    setAnalyzeForm((prev) => ({
      ...prev,
      post: improvedPost,
      platform: improveForm.platform || prev.platform
    }));

    setTab("analyze");
  }

  const copyLabel = isHebrew ? "העתק" : "Copy";
  const deleteLabel = isHebrew ? "מחק" : "Delete";
  const loadLabel = isHebrew ? "טען לטופס" : "Load";
  const filters = [
    { value: "all", label: isHebrew ? "הכל" : "All" },
    { value: "build", label: isHebrew ? "Build" : "Build" },
    { value: "improve", label: isHebrew ? "Improve" : "Improve" },
    { value: "analyze", label: isHebrew ? "Analyze" : "Analyze" }
  ];

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
          </div>
        </header>

        <div className="main-grid">
          <section className="panel glass">
            <div className="tabs">
              <button
                className={`tab-btn ${tab === "build" ? "active" : ""}`}
                onClick={() => setTab("build")}
              >
                {t.build}
              </button>
              <button
                className={`tab-btn ${tab === "improve" ? "active" : ""}`}
                onClick={() => setTab("improve")}
              >
                {t.improve}
              </button>
              <button
                className={`tab-btn ${tab === "analyze" ? "active" : ""}`}
                onClick={() => setTab("analyze")}
              >
                {t.analyze}
              </button>
            </div>

            {tab === "build" && (
              <>
                <div className="field">
                  <label>{t.topic}</label>
                  <input
                    value={buildForm.topic}
                    onChange={(e) => setBuildField("topic", e.target.value)}
                    placeholder={isHebrew ? "על מה הפוסט?" : "What is the post about?"}
                  />
                </div>

                <div className="field">
                  <label>{t.targetAudience}</label>
                  <input
                    value={buildForm.targetAudience}
                    onChange={(e) => setBuildField("targetAudience", e.target.value)}
                    placeholder={isHebrew ? "למי הפוסט מיועד?" : "Who is the audience?"}
                  />
                </div>

                <div className="field">
                  <label>{t.goal}</label>
                  <input
                    value={buildForm.goal}
                    onChange={(e) => setBuildField("goal", e.target.value)}
                    placeholder={isHebrew ? "מה המטרה?" : "What is the goal?"}
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

                <button className="primary-btn" onClick={handleBuild} disabled={loading}>
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

                <button className="primary-btn" onClick={handleImprove} disabled={loading}>
                  {loading ? t.loading : t.improveBtn}
                </button>
              </>
            )}

            {tab === "analyze" && (
              <>
                <div className="field">
                  <label>{t.postText}</label>
                  <textarea
                    rows={8}
                    value={analyzeForm.post}
                    onChange={(e) => setAnalyzeField("post", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>{t.platform}</label>
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
                  {loading ? t.loading : t.analyzeBtn}
                </button>
              </>
            )}

            {error ? <div className="error-box">{error}</div> : null}
            {copyMessage ? <div className="success-box">{copyMessage}</div> : null}
          </section>

          <section className="panel glass">
            <h2>{t.result}</h2>

            {!result && (
              <div className="empty-state">
                {isHebrew ? "עדיין אין תוצאה להצגה" : "No result yet"}
              </div>
            )}

            {result?.type === "build" && (
              <div className="result-wrap">
                <Section title={t.title} onCopy={() => copyText(result.data?.title || "")} copyLabel={copyLabel}>
                  <div className="text-card">{result.data?.title || ""}</div>
                </Section>

                <Section title={t.hook} onCopy={() => copyText(result.data?.hook || "")} copyLabel={copyLabel}>
                  <div className="text-card">{result.data?.hook || ""}</div>
                </Section>

                <Section title={t.body} onCopy={() => copyText(result.data?.body || "")} copyLabel={copyLabel}>
                  <div className="text-card">{result.data?.body || ""}</div>
                </Section>

                <Section title={t.cta} onCopy={() => copyText(result.data?.cta || "")} copyLabel={copyLabel}>
                  <div className="text-card">{result.data?.cta || ""}</div>
                </Section>

                <Section
                  title={t.hashtags}
                  onCopy={() => copyText((result.data?.hashtags || []).join(" "))}
                  copyLabel={copyLabel}
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
                  copyLabel={copyLabel}
                >
                  <div className="text-card">{result.data?.shortVersion || ""}</div>
                </Section>

                <Section
                  title={t.alternativeVersion}
                  onCopy={() => copyText(result.data?.alternativeVersion || "")}
                  copyLabel={copyLabel}
                >
                  <div className="text-card">{result.data?.alternativeVersion || ""}</div>
                </Section>

                <button className="secondary-btn" onClick={moveBuildToImprove}>
                  {isHebrew ? "העבר ל־Improve" : "Move to Improve"}
                </button>
              </div>
            )}

            {result?.type === "improve" && (
              <div className="result-wrap">
                <Section title={t.strengths} copyLabel={copyLabel}>
                  <ListBlock items={result.data?.strengths || []} />
                </Section>

                <Section title={t.weaknesses} copyLabel={copyLabel}>
                  <ListBlock items={result.data?.weaknesses || []} />
                </Section>

                <Section
                  title={t.improvedVersion}
                  onCopy={() => copyText(getPrimaryImproveText(result.data))}
                  copyLabel={copyLabel}
                >
                  <div className="text-card">{getPrimaryImproveText(result.data)}</div>
                </Section>

                <Section
                  title={t.moreViralVersion}
                  onCopy={() => copyText(result.data?.moreViralVersion || "")}
                  copyLabel={copyLabel}
                >
                  <div className="text-card">{result.data?.moreViralVersion || ""}</div>
                </Section>

                <Section
                  title={t.moreAuthenticVersion}
                  onCopy={() => copyText(result.data?.moreAuthenticVersion || "")}
                  copyLabel={copyLabel}
                >
                  <div className="text-card">{result.data?.moreAuthenticVersion || ""}</div>
                </Section>

                <Section title={t.tips} copyLabel={copyLabel}>
                  <ListBlock items={result.data?.tips || []} />
                </Section>

                <button className="secondary-btn" onClick={moveImproveToAnalyze}>
                  {isHebrew ? "נתח את הגרסה המשופרת" : "Analyze improved version"}
                </button>
              </div>
            )}

            {result?.type === "analyze" && (
              <div className="result-wrap">
                <div className="scores-grid">
                  <ScoreCard label={t.viralScore} value={result.data?.viralScore} />
                  <ScoreCard label={t.authenticityScore} value={result.data?.authenticityScore} />
                  <ScoreCard label={t.clarityScore} value={result.data?.clarityScore} />
                  <ScoreCard label={t.emotionalScore} value={result.data?.emotionalScore} />
                  <ScoreCard label={t.curiosityScore} value={result.data?.curiosityScore} />
                  <ScoreCard label={t.hookScore} value={result.data?.hookScore} />
                  <ScoreCard label={t.ctaScore} value={result.data?.ctaScore} />
                </div>

                <Section
                  title={t.summary}
                  onCopy={() => copyText(result.data?.summary || "")}
                  copyLabel={copyLabel}
                >
                  <div className="text-card">{result.data?.summary || ""}</div>
                </Section>

                <Section title={t.whatWorks} copyLabel={copyLabel}>
                  <ListBlock items={result.data?.whatWorks || []} />
                </Section>

                <Section title={t.whatHurts} copyLabel={copyLabel}>
                  <ListBlock items={result.data?.whatHurts || []} />
                </Section>

                <Section title={t.improvements} copyLabel={copyLabel}>
                  <ListBlock items={result.data?.improvements || []} />
                </Section>

                <Section
                  title={t.improvedVersion}
                  onCopy={() => copyText(result.data?.improvedVersion || "")}
                  copyLabel={copyLabel}
                >
                  <div className="text-card">{result.data?.improvedVersion || ""}</div>
                </Section>
              </div>
            )}
          </section>
        </div>

        <section className="panel glass history-panel">
          <div className="history-header">
            <div>
              <h2>{isHebrew ? "היסטוריה" : "History"}</h2>
              <p>{isHebrew ? "ניהול מלא של פריטי ההיסטוריה שלך" : "Full management of your history items"}</p>
            </div>

            <div className="history-actions">
              <select
                className="history-filter"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
              >
                {filters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>

              <button className="secondary-btn" onClick={loadHistory} disabled={historyLoading}>
                {historyLoading ? (isHebrew ? "טוען..." : "Loading...") : (isHebrew ? "רענן" : "Refresh")}
              </button>
            </div>
          </div>

          {historyError ? <div className="error-box">{historyError}</div> : null}

          {historyLoading && history.length === 0 ? (
            <div className="empty-state">{isHebrew ? "טוען היסטוריה..." : "Loading history..."}</div>
          ) : null}

          {!historyLoading && historyItems.length === 0 ? (
            <div className="empty-state">
              {isHebrew
                ? "אין עדיין פריטים בהיסטוריה עבור הסינון הנבחר"
                : "No history items for the selected filter"}
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
                      {loadLabel}
                    </button>

                    <button
                      type="button"
                      className="danger-btn"
                      disabled={deletingId === item._id}
                      onClick={() => handleDeleteHistoryItem(item._id)}
                    >
                      {deletingId === item._id
                        ? (isHebrew ? "מוחק..." : "Deleting...")
                        : deleteLabel}
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
