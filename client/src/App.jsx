import { useMemo, useState } from "react";
import { analyzePost, generatePost, improvePost } from "./api";
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

export default function App() {
  const [language, setLanguage] = useState("he");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [result, setResult] = useState(null);

  const isHebrew = language === "he";
  const dir = isHebrew ? "rtl" : "ltr";

  const t = useMemo(
    () => ({
      build: isHebrew ? "יצירה" : "Build",
      improve: isHebrew ? "שיפור" : "Improve",
      analyze: isHebrew ? "ניתוח" : "Analyze",

      topic: isHebrew ? "נושא / רעיון" : "Topic / Idea",
      targetAudience: isHebrew ? "קהל יעד" : "Target Audience",
      goal: isHebrew ? "מטרה" : "Goal",
      style: isHebrew ? "סגנון" : "Style",
      platform: isHebrew ? "פלטפורמה" : "Platform",
      postText: isHebrew ? "טקסט הפוסט" : "Post Text",

      generate: isHebrew ? "צור פוסט" : "Generate Post",
      improveBtn: isHebrew ? "שפר פוסט" : "Improve Post",
      analyzeBtn: isHebrew ? "נתח פוסט" : "Analyze Post",
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

      viralScore: isHebrew ? "ויראליות" : "Viral",
      authenticityScore: isHebrew ? "אותנטיות" : "Authenticity",
      clarityScore: isHebrew ? "בהירות" : "Clarity",
      emotionalScore: isHebrew ? "רגש" : "Emotion",
      curiosityScore: isHebrew ? "סקרנות" : "Curiosity",
      hookScore: isHebrew ? "פתיח" : "Hook",
      ctaScore: isHebrew ? "הנעה לפעולה" : "CTA",

      summary: isHebrew ? "סיכום" : "Summary",
      whatWorks: isHebrew ? "מה עובד" : "What Works",
      whatHurts: isHebrew ? "מה פוגע" : "What Hurts",
      improvements: isHebrew ? "שיפורים" : "Improvements",

      noResultYet: isHebrew ? "עדיין אין תוצאה להצגה" : "No result yet",
      enterTopic: isHebrew ? "יש להזין נושא לפוסט" : "Please enter a topic",
      enterPostText: isHebrew ? "יש להזין טקסט לפוסט" : "Please enter post text",
      generateFailed: isHebrew ? "יצירת הפוסט נכשלה" : "Generate failed",
      improveFailed: isHebrew ? "שיפור הפוסט נכשל" : "Improve failed",
      analyzeFailed: isHebrew ? "ניתוח הפוסט נכשל" : "Analyze failed",
      copied: isHebrew ? "הועתק" : "Copied",
      copyFailed: isHebrew ? "ההעתקה נכשלה" : "Copy failed",
      copy: isHebrew ? "העתק" : "Copy",

      moveToImprove: isHebrew ? "העבר לשיפור" : "Move to Improve",
      analyzeImproved: isHebrew ? "נתח את הגרסה המשופרת" : "Analyze improved version",

      appSubtitle: isHebrew ? "בנה, שפר ונתח פוסטים" : "Build, improve and analyze posts",
      topicPlaceholder: isHebrew ? "על מה הפוסט?" : "What is the post about?",
      audiencePlaceholder: isHebrew ? "למי הפוסט מיועד?" : "Who is the audience?",
      goalPlaceholder: isHebrew ? "מה המטרה?" : "What is the goal?"
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

  const [analyzeForm, setAnalyzeForm] = useState({
    post: "",
    platform: "instagram"
  });

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopyMessage(t.copied);
      window.setTimeout(() => setCopyMessage(""), 1500);
    } catch {
      setCopyMessage(t.copyFailed);
      window.setTimeout(() => setCopyMessage(""), 1500);
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

      setResult({
        type: "build",
        data: response?.data || {}
      });
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

      setResult({
        type: "improve",
        data: response?.data || {}
      });
    } catch (err) {
      setError(err?.message || t.improveFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    setError("");
    setResult(null);

    const postValue = (analyzeForm.post || "").trim();

    if (!postValue) {
      setError(t.enterPostText);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        post: postValue,
        platform: analyzeForm.platform || "instagram",
        language
      };

      const response = await analyzePost(payload);

      setResult({
        type: "analyze",
        data: response?.data || {}
      });
    } catch (err) {
      setError(err?.message || t.analyzeFailed);
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

  function moveImproveToAnalyze() {
    if (result?.type !== "improve") return;

    setAnalyzeForm((prev) => ({
      ...prev,
      post: getImprovePrimaryText(result.data),
      platform: improveForm.platform || prev.platform
    }));

    setTab("analyze");
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
              <button
                type="button"
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

                <button type="button" className="primary-btn" onClick={handleAnalyze} disabled={loading}>
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
                {t.noResultYet}
              </div>
            )}

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

                <button type="button" className="secondary-btn" onClick={moveImproveToAnalyze}>
                  {t.analyzeImproved}
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
                  copyLabel={t.copy}
                >
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

                <Section
                  title={t.improvedVersion}
                  onCopy={() => copyText(result.data?.improvedVersion || "")}
                  copyLabel={t.copy}
                >
                  <div className="text-card">{result.data?.improvedVersion || ""}</div>
                </Section>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
