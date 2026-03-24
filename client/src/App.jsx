import { useState } from "react";
import { analyzePost, generatePost, improvePost } from "./api";
import { translations } from "./translations";
import StoryEditor from "./components/StoryEditor";

export default function App() {
  const [language] = useState("he");
  const t = translations[language];

  const [tab, setTab] = useState("build");

  const [buildText, setBuildText] = useState("");
  const [improveText, setImproveText] = useState("");
  const [analyzeText, setAnalyzeText] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 סטורי
  const [storyText, setStoryText] = useState("");
  const [storyTextToken, setStoryTextToken] = useState(0);

  function sendToStory(text) {
    if (!text || !text.trim()) return;
    setStoryText(text);
    setStoryTextToken(Date.now());
  }

  async function handleBuild() {
    setLoading(true);
    try {
      const res = await generatePost({ topic: buildText });
      setResult({ type: "build", data: res?.data || {} });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleImprove() {
    setLoading(true);
    try {
      const res = await improvePost({ post: improveText });
      setResult({ type: "improve", data: res?.data || {} });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await analyzePost({ post: analyzeText });
      setResult({ type: "analyze", data: res?.data || {} });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="app" style={{ padding: 20 }}>
      <h1>PostPulse AI 🚀</h1>

      {/* טאבים */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setTab("build")}>Build</button>
        <button onClick={() => setTab("improve")}>Improve</button>
        <button onClick={() => setTab("analyze")}>Analyze</button>
      </div>

      {/* BUILD */}
      {tab === "build" && (
        <div style={{ marginTop: 20 }}>
          <textarea
            placeholder="כתוב נושא לפוסט"
            value={buildText}
            onChange={(e) => setBuildText(e.target.value)}
          />

          <button onClick={handleBuild}>
            {loading ? "..." : "Generate"}
          </button>

          <button onClick={() => sendToStory(buildText)}>
            שלח לסטורי
          </button>
        </div>
      )}

      {/* IMPROVE */}
      {tab === "improve" && (
        <div style={{ marginTop: 20 }}>
          <textarea
            placeholder="הדבק פוסט"
            value={improveText}
            onChange={(e) => setImproveText(e.target.value)}
          />

          <button onClick={handleImprove}>
            {loading ? "..." : "Improve"}
          </button>

          <button onClick={() => sendToStory(improveText)}>
            שלח לסטורי
          </button>
        </div>
      )}

      {/* ANALYZE */}
      {tab === "analyze" && (
        <div style={{ marginTop: 20 }}>
          <textarea
            placeholder="הדבק פוסט"
            value={analyzeText}
            onChange={(e) => setAnalyzeText(e.target.value)}
          />

          <button onClick={handleAnalyze}>
            {loading ? "..." : "Analyze"}
          </button>

          <button onClick={() => sendToStory(analyzeText)}>
            שלח לסטורי
          </button>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Result</h2>

          {result.type === "build" && (
            <>
              <div>
                <b>Title:</b>
                <div>{result.data?.title || "-"}</div>
                <button onClick={() => sendToStory(result.data?.title || "")}>
                  שלח לסטורי
                </button>
              </div>

              <div>
                <b>Body:</b>
                <div>{result.data?.body || "-"}</div>
                <button onClick={() => sendToStory(result.data?.body || "")}>
                  שלח לסטורי
                </button>
              </div>

              <div>
                <b>CTA:</b>
                <div>{result.data?.cta || "-"}</div>
                <button onClick={() => sendToStory(result.data?.cta || "")}>
                  שלח לסטורי
                </button>
              </div>
            </>
          )}

          {result.type === "improve" && (
            <div>
              <b>Improved:</b>
              <div>{result.data?.improvedPost || "-"}</div>
              <button
                onClick={() =>
                  sendToStory(result.data?.improvedPost || "")
                }
              >
                שלח לסטורי
              </button>
            </div>
          )}

          {result.type === "analyze" && (
            <div>
              <b>Improved Version:</b>
              <div>{result.data?.improvedVersion || "-"}</div>
              <button
                onClick={() =>
                  sendToStory(result.data?.improvedVersion || "")
                }
              >
                שלח לסטורי
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🔥 STORY EDITOR */}
      <div style={{ marginTop: 50 }}>
        <h2>Story Editor</h2>

        <StoryEditor
          incomingText={storyText}
          incomingTextToken={storyTextToken}
        />
      </div>
    </div>
  );
}
