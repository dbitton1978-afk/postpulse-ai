import { useMemo, useState } from "react";
import { analyzePost, generatePost, improvePost } from "./api";
import { translations } from "./translations";
import StoryEditor from "./components/StoryEditor";

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

function Section({ title, children, onCopy, onSendToStory }) {
  return (
    <div className="result-section">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
        <h3>{title}</h3>

        <div style={{ display: "flex", gap: 8 }}>
          {onSendToStory && (
            <button className="copy-btn" onClick={onSendToStory}>
              שלח לסטורי
            </button>
          )}

          {onCopy && (
            <button className="copy-btn" onClick={onCopy}>
              Copy
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState("he");
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

  const sendToStory = (text) => {
    if (!text) return;
    setStoryText(text);
    setStoryTextToken(Date.now());
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text || "");
  };

  // ===== API CALLS =====

  const handleBuild = async () => {
    setLoading(true);
    const res = await generatePost(buildForm);
    setResult({ type: "build", data: res.data });
    setLoading(false);
  };

  const handleImprove = async () => {
    setLoading(true);
    const res = await improvePost(improveForm);
    setResult({ type: "improve", data: res.data });
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    const res = await analyzePost(analyzeForm);
    setResult({ type: "analyze", data: res.data });
    setLoading(false);
  };

  // ===== UI =====

  return (
    <div className="app">
      <h1>PostPulse AI 🚀</h1>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setTab("build")}>Build</button>
        <button onClick={() => setTab("improve")}>Improve</button>
        <button onClick={() => setTab("analyze")}>Analyze</button>
      </div>

      {/* BUILD */}
      {tab === "build" && (
        <div>
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
        <div>
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
            שלח טקסט לסטורי
          </button>
        </div>
      )}

      {/* ANALYZE */}
      {tab === "analyze" && (
        <div>
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
            שלח טקסט לסטורי
          </button>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div>
          <h2>Result</h2>

          {result.type === "build" && (
            <>
              <Section
                title="Title"
                onSendToStory={() => sendToStory(result.data.title)}
              >
                {result.data.title}
              </Section>

              <Section
                title="Body"
                onSendToStory={() => sendToStory(result.data.body)}
              >
                {result.data.body}
              </Section>

              <Section
                title="CTA"
                onSendToStory={() => sendToStory(result.data.cta)}
              >
                {result.data.cta}
              </Section>
            </>
          )}

          {result.type === "improve" && (
            <Section
              title="Improved"
              onSendToStory={() =>
                sendToStory(result.data.improvedPost)
              }
            >
              {result.data.improvedPost}
            </Section>
          )}

          {result.type === "analyze" && (
            <Section
              title="Improved Version"
              onSendToStory={() =>
                sendToStory(result.data.improvedVersion)
              }
            >
              {result.data.improvedVersion}
            </Section>
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
