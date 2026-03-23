import { useMemo, useState } from "react";
import {
  analyzeImage,
  analyzePost,
  generatePost,
  generatePostFromImageAnalysis,
  improvePost
} from "./api";
import { translations } from "./translations";

const styles = [
  { value: "kabbalist", he: "קבליסט", en: "Kabbalist" },
  { value: "mentor", he: "מנטור", en: "Mentor" },
  { value: "humorous", he: "הומוריסטי", en: "Humorous" },
  { value: "spiritual", he: "רוחני", en: "Spiritual" },
  { value: "emotional", he: "רגשי", en: "Emotional" },
  { value: "professional", he: "מקצועי", en: "Professional" }
];

const platforms = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" }
];

function Section({ title, children, onCopy }) {
  return (
    <div className="result-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12
        }}
      >
        <h3>{title}</h3>
        {onCopy && (
          <button className="copy-btn" onClick={onCopy}>
            Copy
          </button>
        )}
      </div>
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
      <div className="score-value">{Number.isFinite(value) ? value : 0}%</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState("en");
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

  const [imageData, setImageData] = useState("");
  const [imageAnalysis, setImageAnalysis] = useState(null);

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imagePostLoading, setImagePostLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result?.toString() || "");
      setImageAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleBuild = async () => {
    if (!buildForm.topic.trim()) {
      setError(language === "he" ? "יש להזין נושא" : "Please enter a topic");
      return;
    }

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
    if (!improveForm.post.trim()) {
      setError(language === "he" ? "יש להזין פוסט" : "Please enter a post");
      return;
    }

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
    if (!analyzeForm.post.trim()) {
      setError(language === "he" ? "יש להזין פוסט" : "Please enter a post");
      return;
    }

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

  const handleAnalyzeImage = async () => {
    if (!imageData) {
      setError(t.noImageUploaded);
      return;
    }

    setImageLoading(true);
    setError("");
    setImageAnalysis(null);

    try {
      const res = await analyzeImage({
        imageData,
        language
      });

      setImageAnalysis(res.data);
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateFromImage = async () => {
    if (!imageAnalysis) {
      setError(language === "he" ? "צריך קודם לנתח את התמונה" : "Please analyze the image first");
      return;
    }

    setImagePostLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await generatePostFromImageAnalysis({
        analysis: imageAnalysis,
        language,
        style: buildForm.style,
        goal: buildForm.goal,
        platform: buildForm.platform,
        targetAudience: buildForm.targetAudience
      });

      setResult({ type: "build", data: res.data });
      setTab("build");
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setImagePostLoading(false);
    }
  };

  const buildCopyText =
    result?.type === "build"
      ? [
          result.data?.title || "",
          result.data?.hook || "",
          result.data?.body || "",
          result.data?.cta || "",
          (result.data?.hashtags || []).join(" ")
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

  const improveCopyText =
    result?.type === "improve"
      ? [
          result.data?.improvedPost || "",
          result.data?.moreViralVersion || "",
          result.data?.moreAuthenticVersion || ""
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

  const analyzeCopyText =
    result?.type === "analyze" ? result.data?.improvedVersion || "" : "";

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
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            {t.english}
          </button>
          <button
            className={language === "he" ? "active" : ""}
            onClick={() => setLanguage("he")}
          >
            {t.hebrew}
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

              <div className="field">
                <label>{t.uploadImage}</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>

              {imageData && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, fontWeight: 700 }}>
                    {t.imagePreview}
                  </div>
                  <img
                    src={imageData}
                    alt="preview"
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      objectFit: "cover",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.12)"
                    }}
                  />
                </div>
              )}

              <div style={{ display: "grid", gap: 10 }}>
                <button className="primary-btn" onClick={handleBuild}>
                  {loading ? t.loading : t.generate}
                </button>

                <button className="primary-btn" onClick={handleAnalyzeImage}>
                  {imageLoading ? t.loading : t.analyzeImage}
                </button>

                <button className="primary-btn" onClick={handleGenerateFromImage}>
                  {imagePostLoading ? t.loading : t.generateFromImage}
                </button>
              </div>

              {imageAnalysis && (
                <div style={{ marginTop: 20 }}>
                  <Section title={t.imageAnalysis}>
                    <div className="text-card" style={{ marginBottom: 12 }}>
                      {imageAnalysis.summary || ""}
                    </div>

                    <Section title={t.mainSubjects}>
                      <ListBlock items={imageAnalysis.mainSubjects || []} />
                    </Section>

                    <Section title={t.visualMood}>
                      <div className="text-card">{imageAnalysis.visualMood || ""}</div>
                    </Section>

                    <Section title={t.emotionalTone}>
                      <div className="text-card">{imageAnalysis.emotionalTone || ""}</div>
                    </Section>

                    <Section title={t.visualStrengths}>
                      <ListBlock items={imageAnalysis.visualStrengths || []} />
                    </Section>

                    <Section title={t.visualWeaknesses}>
                      <ListBlock items={imageAnalysis.visualWeaknesses || []} />
                    </Section>

                    <Section title={t.contentAngles}>
                      <ListBlock items={imageAnalysis.contentAngles || []} />
                    </Section>

                    <Section title={t.audienceFit}>
                      <div className="text-card">{imageAnalysis.audienceFit || ""}</div>
                    </Section>

                    <Section title={t.storyPotential}>
                      <div className="text-card">{imageAnalysis.storyPotential || ""}</div>
                    </Section>

                    <Section title={t.bestPostDirection}>
                      <div className="text-card">
                        {imageAnalysis.bestPostDirection || ""}
                      </div>
                    </Section>

                    <Section title={t.suggestedStyle}>
                      <div className="text-card">{imageAnalysis.suggestedStyle || ""}</div>
                    </Section>
                  </Section>
                </div>
              )}
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
              <Section
                title={t.title}
                onCopy={() => copyText(result.data?.title || "")}
              >
                <div className="text-card">{result.data?.title || ""}</div>
              </Section>

              <Section
                title={t.hook}
                onCopy={() => copyText(result.data?.hook || "")}
              >
                <div className="text-card">{result.data?.hook || ""}</div>
              </Section>

              <Section
                title={t.body}
                onCopy={() => copyText(result.data?.body || "")}
              >
                <div className="text-card">{result.data?.body || ""}</div>
              </Section>

              <Section
                title={t.cta}
                onCopy={() => copyText(result.data?.cta || "")}
              >
                <div className="text-card">{result.data?.cta || ""}</div>
              </Section>

              <Section
                title={t.hashtags}
                onCopy={() => copyText((result.data?.hashtags || []).join(" "))}
              >
                <div className="hashtags">
                  {(result.data?.hashtags || []).map((tag, index) => (
                    <span key={`${tag}-${index}`}>#{tag.replace(/^#/, "")}</span>
                  ))}
                </div>
              </Section>

              <Section
                title={t.shortVersion}
                onCopy={() => copyText(result.data?.shortVersion || "")}
              >
                <div className="text-card">{result.data?.shortVersion || ""}</div>
              </Section>

              <Section
                title={t.alternativeVersion}
                onCopy={() => copyText(result.data?.alternativeVersion || "")}
              >
                <div className="text-card">
                  {result.data?.alternativeVersion || ""}
                </div>
              </Section>

              <button
                className="primary-btn"
                style={{ marginTop: 10 }}
                onClick={() => copyText(buildCopyText)}
              >
                Copy Full Post
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
                onCopy={() => copyText(result.data?.improvedPost || "")}
              >
                <div className="text-card">{result.data?.improvedPost || ""}</div>
              </Section>

              <Section
                title={t.moreViralVersion}
                onCopy={() => copyText(result.data?.moreViralVersion || "")}
              >
                <div className="text-card">
                  {result.data?.moreViralVersion || ""}
                </div>
              </Section>

              <Section
                title={t.moreAuthenticVersion}
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
                className="primary-btn"
                style={{ marginTop: 10 }}
                onClick={() => copyText(improveCopyText)}
              >
                Copy Improved Versions
              </button>
            </div>
          )}

          {result?.type === "analyze" && (
            <div className="result-wrap">
              <div className="scores-grid">
                <ScoreCard
                  label={t.viralScore}
                  value={result.data?.viralScore ?? 0}
                />
                <ScoreCard
                  label={t.authenticityScore}
                  value={result.data?.authenticityScore ?? 0}
                />
                <ScoreCard
                  label={t.clarityScore}
                  value={result.data?.clarityScore ?? 0}
                />
                <ScoreCard
                  label={t.emotionalScore}
                  value={result.data?.emotionalScore ?? 0}
                />
                <ScoreCard
                  label={t.hookScore}
                  value={result.data?.hookScore ?? 0}
                />
                <ScoreCard
                  label={t.ctaScore}
                  value={result.data?.ctaScore ?? 0}
                />
              </div>

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

              <Section
                title={t.improvedVersion}
                onCopy={() => copyText(analyzeCopyText)}
              >
                <div className="text-card">
                  {result.data?.improvedVersion || ""}
                </div>
              </Section>

              <button
                className="primary-btn"
                style={{ marginTop: 10 }}
                onClick={() => copyText(analyzeCopyText)}
              >
                Copy Improved Version
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
