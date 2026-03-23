import { useMemo, useState } from "react";
import { analyzePost, generatePost, improvePost } from "./api";
import { translations } from "./translations";

const styles = [
  { value: "kabbalist", he: "קבליסט", en: "Kabbalist" },
  { value: "mentor", he: "מנטור", en: "Mentor" },
  { value: "humorous", he: "הומוריסטי", en: "Humorous" },
  { value: "spiritual", he: "רוחני", en: "Spiritual" },
  { value: "professional", he: "מקצועי", en: "Professional" }
];

const platforms = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" }
];

function Section({ title, children }) {
  return (
    <div className="result-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ListBlock({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="result-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function ScoreCard({ label, value }) {
  return (
    <div className="score-card">
      <div className="score-value">{value}%</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState("he");
  const [tab, setTab] = useState("build");
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
    style: "professional"
  });

  const [analyzeForm, setAnalyzeForm] = useState({
    post: "",
    platform: "instagram"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleBuild = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await generatePost({
        ...buildForm,
        language
      });

      setResult({ type: "build", data: res.data });
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await improvePost({
        ...improveForm,
        language
      });

      setResult({ type: "improve", data: res.data });
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await analyzePost({
        ...analyzeForm,
        language
      });

      setResult({ type: "analyze", data: res.data });
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app" dir={dir}>
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <header className="hero">
        <div>
          <h1>{t.appName}</h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="lang-switch">
          <button
            className={language === "he" ? "active" : ""}
            onClick={() => setLanguage("he")}
          >
            {t.hebrew}
          </button>
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            {t.english}
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={tab === "build" ? "active" : ""}
          onClick={() => setTab("build")}
        >
          {t.build}
        </button>
        <button
          className={tab === "improve" ? "active" : ""}
          onClick={() => setTab("improve")}
        >
          {t.improve}
        </button>
        <button
          className={tab === "analyze" ? "active" : ""}
          onClick={() => setTab("analyze")}
        >
          {t.analyze}
        </button>
      </nav>

      <main className="layout">
        <section className="panel glass">
          {tab === "build" && (
            <>
              <div className="field">
                <label>{t.topic}</label>
                <textarea
                  rows={4}
                  value={buildForm.topic}
                  onChange={(e) =>
                    setBuildForm({ ...buildForm, topic: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>{t.targetAudience}</label>
                <input
                  value={buildForm.targetAudience}
                  onChange={(e) =>
                    setBuildForm({
                      ...buildForm,
                      targetAudience: e.target.value
                    })
                  }
                />
              </div>

              <div className="field">
                <label>{t.goal}</label>
                <input
                  value={buildForm.goal}
                  onChange={(e) =>
                    setBuildForm({ ...buildForm, goal: e.target.value })
                  }
                />
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>{t.style}</label>
                  <select
                    value={buildForm.style}
                    onChange={(e) =>
                      setBuildForm({ ...buildForm, style: e.target.value })
                    }
                  >
                    {styles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {language === "he" ? style.he : style.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>{t.platform}</label>
                  <select
                    value={buildForm.platform}
                    onChange={(e) =>
                      setBuildForm({ ...buildForm, platform: e.target.value })
                    }
                  >
                    {platforms.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button className="primary-btn" onClick={handleBuild}>
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
                  onChange={(e) =>
                    setImproveForm({ ...improveForm, post: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>{t.goal}</label>
                <input
                  value={improveForm.goal}
                  onChange={(e) =>
                    setImproveForm({ ...improveForm, goal: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>{t.style}</label>
                <select
                  value={improveForm.style}
                  onChange={(e) =>
                    setImproveForm({ ...improveForm, style: e.target.value })
                  }
                >
                  {styles.map((style) => (
                    <option key={style.value} value={style.value}>
                      {language === "he" ? style.he : style.en}
                    </option>
                  ))}
                </select>
              </div>

              <button className="primary-btn" onClick={handleImprove}>
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
                  onChange={(e) =>
                    setAnalyzeForm({ ...analyzeForm, post: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>{t.platform}</label>
                <select
                  value={analyzeForm.platform}
                  onChange={(e) =>
                    setAnalyzeForm({
                      ...analyzeForm,
                      platform: e.target.value
                    })
                  }
                >
                  {platforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              <button className="primary-btn" onClick={handleAnalyze}>
                {loading ? t.loading : t.analyzeBtn}
              </button>
            </>
          )}

          {error && <div className="error-box">{error}</div>}
        </section>

        <section className="panel glass">
          <h2>{t.result}</h2>

          {!result && <div className="empty-state">PostPulse AI ✨</div>}

          {result?.type === "build" && (
            <div className="result-wrap">
              <Section title={t.title}>
                <div className="text-card">{result.data.title}</div>
              </Section>

              <Section title={t.hook}>
                <div className="text-card">{result.data.hook}</div>
              </Section>

              <Section title={t.body}>
                <div className="text-card">{result.data.body}</div>
              </Section>

              <Section title={t.cta}>
                <div className="text-card">{result.data.cta}</div>
              </Section>

              <Section title={t.hashtags}>
                <div className="hashtags">
                  {result.data.hashtags?.map((tag, index) => (
                    <span key={`${tag}-${index}`}>#{tag.replace(/^#/, "")}</span>
                  ))}
                </div>
              </Section>

              <Section title={t.shortVersion}>
                <div className="text-card">{result.data.shortVersion}</div>
              </Section>

              <Section title={t.alternativeVersion}>
                <div className="text-card">{result.data.alternativeVersion}</div>
              </Section>
            </div>
          )}

          {result?.type === "improve" && (
            <div className="result-wrap">
              <Section title={t.strengths}>
                <ListBlock items={result.data.strengths} />
              </Section>

              <Section title={t.weaknesses}>
                <ListBlock items={result.data.weaknesses} />
              </Section>

              <Section title={t.improvedVersion}>
                <div className="text-card">{result.data.improvedPost}</div>
              </Section>

              <Section title={t.moreViralVersion}>
                <div className="text-card">{result.data.moreViralVersion}</div>
              </Section>

              <Section title={t.moreAuthenticVersion}>
                <div className="text-card">{result.data.moreAuthenticVersion}</div>
              </Section>

              <Section title={t.tips}>
                <ListBlock items={result.data.tips} />
              </Section>
            </div>
          )}

          {result?.type === "analyze" && (
            <div className="result-wrap">
              <div className="scores-grid">
                <ScoreCard label={t.viralScore} value={result.data.viralScore} />
                <ScoreCard
                  label={t.authenticityScore}
                  value={result.data.authenticityScore}
                />
                <ScoreCard label={t.clarityScore} value={result.data.clarityScore} />
                <ScoreCard
                  label={t.emotionalScore}
                  value={result.data.emotionalScore}
                />
                <ScoreCard label={t.hookScore} value={result.data.hookScore} />
                <ScoreCard label={t.ctaScore} value={result.data.ctaScore} />
              </div>

              <Section title={t.summary}>
                <div className="text-card">{result.data.summary}</div>
              </Section>

              <Section title={t.whatWorks}>
                <ListBlock items={result.data.whatWorks} />
              </Section>

              <Section title={t.whatHurts}>
                <ListBlock items={result.data.whatHurts} />
              </Section>

              <Section title={t.improvements}>
                <ListBlock items={result.data.improvements} />
              </Section>

              <Section title={t.improvedVersion}>
                <div className="text-card">{result.data.improvedVersion}</div>
              </Section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
