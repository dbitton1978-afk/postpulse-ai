import { useMemo, useState } from "react";
import { analyzePost, generatePost, improvePost } from "./api";
import { translations } from "./translations";
import StoryEditor from "./components/StoryEditor";

const styles = [
  { value: "kabbalist", he: "קבליסט" },
  { value: "mentor", he: "מנטור" },
  { value: "humorous", he: "הומוריסטי" },
  { value: "spiritual", he: "רוחני" },
  { value: "emotional", he: "רגשי" },
  { value: "professional", he: "מקצועי" }
];

const platforms = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" }
];

export default function App() {
  const [language] = useState("he");
  const t = useMemo(() => translations[language], [language]);

  const [tab, setTab] = useState("build");

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

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 חיבור לסטורי
  const [storyText, setStoryText] = useState("");
  const [storyTextToken, setStoryTextToken] = useState(0);

  function sendToStory(text) {
    if (!text || !text.trim()) return;
    setStoryText(text);
    setStoryTextToken(Date.now());
  }

  function copyText(text) {
    navigator.clipboard.writeText(text || "");
  }

  // ===== API =====

  const handleBuild = async () => {
    setLoading(true);
    try {
      const res = await generatePost(buildForm);
      setResult({ type: "build", data: res.data });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleImprove = async () => {
    setLoading(true);
    try {
      const res = await improvePost(improveForm);
      setResult({ type: "improve", data: res.data });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzePost(analyzeForm);
      setResult({ type: "analyze", data: res.data });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="app" style={{ padding: 20 }}>
      <h1>PostPulse AI 🚀</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setTab("build")}>Build</button>
        <button onClick={() => setTab("improve")}>Improve</button>
        <button onClick={() => setTab("analyze")}>Analyze</button>
      </div>

      {/* BUILD */}
      {tab === "build" && (
        <div style={{ marginTop: 20 }}>
          <textarea
            placeholder="נושא"
            value={buildForm.topic}
            onChange={(e) =>
              setBuildForm({ ...buildForm, topic: e.target.value })
            }
          />

          <button onClick={handleBuild}>
            {loading ? "..." : "Generate"}
          </button>
        </div>
      )}

      {/* IMPROVE */}
      {tab === "improve" && (
        <div style={{ marginTop: 20 }}>
          <textarea
            placeholder="הדבק פוסט"
            value={improveForm.post}
            onChange={(e) =>
              setImproveForm({ ...improveForm, post: e.target.value })
            }
          />

          <button onClick={handleImprove}>
            {loading ? "..." : "Improve"}
          </button>

          <button onClick={() => sendToStory(improveForm.post)}>
            שלח לסטורי
          </button>
        </div>
      )}

      {/* ANALYZE */}
      {tab === "analyze" && (
        <div style={{ marginTop: 20 }}>
          <textarea
            placeholder="הדבק פוסט"
            value={analyzeForm.post}
            onChange={(e) =>
              setAnalyzeForm({ ...analyzeForm, post: e.target.value })
            }
          />

          <button onClick={handleAnalyze}>
            {loading ? "..." : "Analyze"}
          </button>

          <button onClick={() => sendToStory(analyzeForm.post)}>
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
                <h3>Title</h3>
                <div>{result.data.title}</div>
                <button onClick={() => sendToStory(result.data.title)}>
                  שלח לסטורי
                </button>
              </div>

              <div>
                <h3>Body</h3>
                <div>{result.data.body}</div>
                <button onClick={() => sendToStory(result.data.body)}>
                  שלח לסטורי
                </button>
              </div>

              <div>
                <h3>CTA</h3>
                <div>{result.data.cta}</div>
                <button onClick={() => sendToStory(result.data.cta)}>
                  שלח לסטורי
                </button>
              </div>
            </>
          )}

          {result.type === "improve" && (
            <div>
              <h3>Improved</h3>
              <div>{result.data.improvedPost}</div>
              <button
                onClick={() =>
                  sendToStory(result.data.improvedPost || "")
                }
              >
                שלח לסטורי
              </button>
            </div>
          )}

          {result.type === "analyze" && (
            <div>
              <h3>Improved Version</h3>
              <div>{result.data.improvedVersion}</div>
              <button
                onClick={() =>
                  sendToStory(result.data.improvedVersion || "")
                }
              >
                שלח לסטורי
              </button>
            </div>
          )}
        </div>
      )}

      {/* STORY EDITOR */}
      <div style={{ marginTop: 40 }}>
        <h2>Story Editor</h2>

        <StoryEditor
          incomingText={storyText}
          incomingTextToken={storyTextToken}
        />
      </div>
    </div>
  );
}
