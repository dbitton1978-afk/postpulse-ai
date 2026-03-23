import { useState } from "react";
import { generatePost, improvePost, analyzePost } from "./api";
import { translations } from "./translations";

export default function App() {
  const [lang, setLang] = useState("he");
  const t = translations[lang];

  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [buildData, setBuildData] = useState({
    topic: "",
    targetAudience: "",
    goal: "",
    style: "professional",
    platform: "instagram"
  });

  const [improveData, setImproveData] = useState({
    post: "",
    goal: "",
    style: "professional"
  });

  const [analyzeData, setAnalyzeData] = useState({
    post: "",
    platform: "instagram"
  });

  const handleBuild = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await generatePost({ ...buildData, language: lang });
      setResult({ type: "build", data: res.data });
    } catch (e) {
      setError("Error creating post");
    }
    setLoading(false);
  };

  const handleImprove = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await improvePost({ ...improveData, language: lang });
      setResult({ type: "improve", data: res.data });
    } catch {
      setError("Error improving post");
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await analyzePost({ ...analyzeData, language: lang });
      setResult({ type: "analyze", data: res.data });
    } catch {
      setError("Error analyzing post");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{t.appName}</h1>

      <button onClick={() => setLang("he")}>{t.hebrew}</button>
      <button onClick={() => setLang("en")}>{t.english}</button>

      <hr />

      <button onClick={() => setTab("build")}>{t.build}</button>
      <button onClick={() => setTab("improve")}>{t.improve}</button>
      <button onClick={() => setTab("analyze")}>{t.analyze}</button>

      <hr />

      {tab === "build" && (
        <>
          <textarea
            placeholder={t.topic}
            onChange={(e) =>
              setBuildData({ ...buildData, topic: e.target.value })
            }
          />
          <button onClick={handleBuild}>
            {loading ? t.loading : t.generate}
          </button>
        </>
      )}

      {tab === "improve" && (
        <>
          <textarea
            placeholder={t.postText}
            onChange={(e) =>
              setImproveData({ ...improveData, post: e.target.value })
            }
          />
          <button onClick={handleImprove}>
            {loading ? t.loading : t.improveBtn}
          </button>
        </>
      )}

      {tab === "analyze" && (
        <>
          <textarea
            placeholder={t.postText}
            onChange={(e) =>
              setAnalyzeData({ ...analyzeData, post: e.target.value })
            }
          />
          <button onClick={handleAnalyze}>
            {loading ? t.loading : t.analyzeBtn}
          </button>
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
