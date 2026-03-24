import { useMemo, useState } from "react";
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

function Section(props) {
  const { title, children, onCopy, copyLabel } = props;

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

function ListBlock(props) {
  const { items } = props;

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <ul className="result-list">
      {items.map((item, index) => (
        <li key={`${String(item)}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function ScoreCard(props) {
  const { label, value } = props;
  const num = Number(value);
  const safeValue = Number.isFinite(num) ? Math.round(num) : 0;

  return (
    <div className="score-card">
      <div className="score-value">{safeValue}%</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const t = useMemo(() => translations[language], [language]);
  const dir = language === "he" ? "rtl" : "ltr";

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
    } catch (err) {
      console.error("Copy failed", err);
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

      setResult({
        type: "build",
        data: response && response.data ? response.data : {}
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

      setResult({
        type: "improve",
        data: response && response.data ? response.data : {}
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

      setResult({
        type: "analyze",
        data: response && response.data ? response.data : {}
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
          result.data && result.data.title ? result.data.title : "",
          result.data && result.data.hook ? result.data.hook : "",
          result.data && result.data.body ? result.data.body : "",
          result.data && result.data.cta ? result.data.cta : "",
          result.data &&
          result.data.hashtags &&
          Array.isArray(result.data.hashtags)
            ? result.data.hashtags.join(" ")
            : "",
          result.data && result.data.shortVersion ? result.data.shortVersion : "",
          result.data && result.data.alternativeVersion
            ? result.data.alternativeVersion
            : ""
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

  const improveCopyText =
    result && result.type === "improve"
      ? [
          result.data && result.data.improvedPost ? result.data.improvedPost : "",
          result.data && result.data.moreViralVersion
            ? result.data.moreViralVersion
            : "",
          result.data && result.data.moreAuthenticVersion
            ? result.data.moreAuthenticVersion
            : ""
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

  const analyzeCopyText =
    result &&
    result.type === "analyze" &&
    result.data &&
    result.data.improvedVersion
      ? result.data.improvedVersion
      : "";

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
            onClick={() => setTab("build")}
          >
            {t.build}
          </button>
          <button
            type="button"
            className={tab === "improve" ? "active" : ""}
            onClick={() => setTab("improve")}
          >
            {t.improve}
          </button>
          <button
            type="button"
            className={tab === "analyze" ? "active" : ""}
            onClick={() => setTab("analyze")}
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
                    onChange={(e) =>
                      setBuildField("targetAudience", e.target.value)
                    }
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
          </section>

          <section className="panel glass">
            <div className="panel-title">{t.result}</div>

            {!result ? <div className="empty-state">{t.emptyState}</div> : null}

            {result && result.type === "build" ? (
              <div className="result-wrap">
                <Section
                  title={t.title}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data ? result.data.title : "")}
                >
                  <div className="text-card">
                    {result.data ? result.data.title : ""}
                  </div>
                </Section>

                <Section
                  title={t.hook}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data ? result.data.hook : "")}
                >
                  <div className="text-card">
                    {result.data ? result.data.hook : ""}
                  </div>
                </Section>

                <Section
                  title={t.body}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data ? result.data.body : "")}
                >
                  <div className="text-card">
                    {result.data ? result.data.body : ""}
                  </div>
                </Section>

                <Section
                  title={t.cta}
                  copyLabel={t.copy}
                  onCopy={() => copyText(result.data ? result.data.cta : "")}
                >
                  <div className="text-card">
                    {result.data ? result.data.cta : ""}
                  </div>
                </Section>

                <Section
                  title={t.hashtags}
                  copyLabel={t.copy}
                  onCopy={() =>
                    copyText(
                      result.data &&
                        result.data.hashtags &&
                        Array.isArray(result.data.hashtags)
                        ? result.data.hashtags.join(" ")
                        : ""
                    )
                  }
                >
                  <div className="hashtags">
                    {result.data &&
                    result.data.hashtags &&
                    Array.isArray(result.data.hashtags)
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
                  onCopy={() =>
                    copyText(result.data ? result.data.shortVersion : "")
                  }
                >
                  <div className="text-card">
                    {result.data ? result.data.shortVersion : ""}
                  </div>
                </Section>

                <Section
                  title={t.alternativeVersion}
                  copyLabel={t.copy}
                  onCopy={() =>
                    copyText(result.data ? result.data.alternativeVersion : "")
                  }
                >
                  <div className="text-card">
                    {result.data ? result.data.alternativeVersion : ""}
                  </div>
                </Section>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => copyText(buildCopyText)}
                >
                  {t.copyFullPost}
                </button>
              </div>
            ) : null}

            {result && result.type === "improve" ? (
              <div className="result-wrap">
                <Section title={t.strengths}>
                  <ListBlock
                    items={
                      result.data && result.data.strengths
                        ? result.data.strengths
                        : []
                    }
                  />
                </Section>

                <Section title={t.weaknesses}>
                  <ListBlock
                    items={
                      result.data && result.data.weaknesses
                        ? result.data.weaknesses
                        : []
                    }
                  />
                </Section>

                <Section
                  title={t.improvedVersion}
                  copyLabel={t.copy}
                  onCopy={() =>
                    copyText(result.data ? result.data.improvedPost : "")
                  }
                >
                  <div className="text-card">
                    {result.data ? result.data.improvedPost : ""}
                  </div>
                </Section>

                <Section
                  title={t.moreViralVersion}
                  copyLabel={t.copy}
                  onCopy={() =>
                    copyText(result.data ? result.data.moreViralVersion : "")
                  }
                >
                  <div className="text-card">
                    {result.data ? result.data.moreViralVersion : ""}
                  </div>
                </Section>

                <Section
                  title={t.moreAuthenticVersion}
                  copyLabel={t.copy}
                  onCopy={() =>
                    copyText(
                      result.data ? result.data.moreAuthenticVersion : ""
                    )
                  }
                >
                  <div className="text-card">
                    {result.data ? result.data.moreAuthenticVersion : ""}
                  </div>
                </Section>

                <Section title={t.tips}>
                  <ListBlock
                    items={result.data && result.data.tips ? result.data.tips : []}
                  />
                </Section>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => copyText(improveCopyText)}
                >
                  {t.copyImproved}
                </button>
              </div>
            ) : null}

            {result && result.type === "analyze" ? (
              <div className="result-wrap">
                <div className="scores-grid">
                  <ScoreCard
                    label={t.viralScore}
                    value={result.data ? result.data.viralScore : 0}
                  />
                  <ScoreCard
                    label={t.authenticityScore}
                    value={result.data ? result.data.authenticityScore : 0}
                  />
                  <ScoreCard
                    label={t.clarityScore}
                    value={result.data ? result.data.clarityScore : 0}
                  />
                  <ScoreCard
                    label={t.emotionalScore}
                    value={result.data ? result.data.emotionalScore : 0}
                  />
                  <ScoreCard
                    label={t.curiosityScore}
                    value={result.data ? result.data.curiosityScore : 0}
                  />
                  <ScoreCard
                    label={t.hookScore}
                    value={result.data ? result.data.hookScore : 0}
                  />
                  <ScoreCard
                    label={t.ctaScore}
                    value={result.data ? result.data.ctaScore : 0}
                  />
                </div>

                <Section title={t.summary}>
                  <div className="text-card">
                    {result.data ? result.data.summary : ""}
                  </div>
                </Section>

                <Section title={t.whatWorks}>
                  <ListBlock
                    items={
                      result.data && result.data.whatWorks
                        ? result.data.whatWorks
                        : []
                    }
                  />
                </Section>

                <Section title={t.whatHurts}>
                  <ListBlock
                    items={
                      result.data && result.data.whatHurts
                        ? result.data.whatHurts
                        : []
                    }
                  />
                </Section>

                <Section title={t.improvements}>
                  <ListBlock
                    items={
                      result.data && result.data.improvements
                        ? result.data.improvements
                        : []
                    }
                  />
                </Section>

                <Section title={t.raiseViralScore}>
                  <ListBlock
                    items={
                      result.data && result.data.raiseViralScore
                        ? result.data.raiseViralScore
                        : []
                    }
                  />
                </Section>

                <Section title={t.raiseAuthenticityScore}>
                  <ListBlock
                    items={
                      result.data && result.data.raiseAuthenticityScore
                        ? result.data.raiseAuthenticityScore
                        : []
                    }
                  />
                </Section>

                <Section title={t.raiseEmotionalScore}>
                  <ListBlock
                    items={
                      result.data && result.data.raiseEmotionalScore
                        ? result.data.raiseEmotionalScore
                        : []
                    }
                  />
                </Section>

                <Section title={t.raiseCuriosityScore}>
                  <ListBlock
                    items={
                      result.data && result.data.raiseCuriosityScore
                        ? result.data.raiseCuriosityScore
                        : []
                    }
                  />
                </Section>

                <Section
                  title={t.improvedVersion}
                  copyLabel={t.copy}
                  onCopy={() => copyText(analyzeCopyText)}
                >
                  <div className="text-card">{analyzeCopyText}</div>
                </Section>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => copyText(analyzeCopyText)}
                >
                  {t.copyAnalyze}
                </button>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
