import { useEffect, useMemo, useState } from "react";
import {
  analyzePost,
  generatePost,
  improvePost,
  loadMyPosts,
  savePost,
  logoutUser,
  getStoredUser
} from "./api";
import { translations } from "./translations";
import "./App.css";

export default function App() {
  const [language, setLanguage] = useState("en");
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const user = getStoredUser();
  const t = useMemo(() => translations[language], [language]);

  const [buildForm, setBuildForm] = useState({
    topic: "",
    targetAudience: "",
    goal: ""
  });

  const [improveForm, setImproveForm] = useState({
    post: "",
    goal: ""
  });

  const [analyzeForm, setAnalyzeForm] = useState({
    post: ""
  });

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await loadMyPosts();
      setHistory(res.posts || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function saveToDB(type, data) {
    try {
      await savePost({
        type,
        content: data
      });
      await loadHistory();
    } catch (err) {
      console.error("Save failed", err);
    }
  }

  async function handleBuild() {
    if (!buildForm.topic) return setError("Topic required");

    setLoading(true);
    setError("");

    try {
      const res = await generatePost({
        ...buildForm,
        language
      });

      setResult({ type: "build", data: res.data });

      await saveToDB("build", res.data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  async function handleImprove() {
    if (!improveForm.post) return setError("Post required");

    setLoading(true);
    setError("");

    try {
      const res = await improvePost({
        ...improveForm,
        language
      });

      setResult({ type: "improve", data: res.data });

      await saveToDB("improve", res.data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  async function handleAnalyze() {
    if (!analyzeForm.post) return setError("Post required");

    setLoading(true);
    setError("");

    try {
      const res = await analyzePost({
        ...analyzeForm,
        language
      });

      setResult({ type: "analyze", data: res.data });

      await saveToDB("analyze", res.data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="app">
      <h1>PostPulse AI</h1>

      <div>
        <button onClick={() => setTab("build")}>Build</button>
        <button onClick={() => setTab("improve")}>Improve</button>
        <button onClick={() => setTab("analyze")}>Analyze</button>
        <button onClick={() => logoutUser()}>Logout</button>
      </div>

      {tab === "build" && (
        <div>
          <input
            placeholder="Topic"
            value={buildForm.topic}
            onChange={(e) =>
              setBuildForm({ ...buildForm, topic: e.target.value })
            }
          />
          <input
            placeholder="Audience"
            value={buildForm.targetAudience}
            onChange={(e) =>
              setBuildForm({
                ...buildForm,
                targetAudience: e.target.value
              })
            }
          />
          <input
            placeholder="Goal"
            value={buildForm.goal}
            onChange={(e) =>
              setBuildForm({ ...buildForm, goal: e.target.value })
            }
          />

          <button onClick={handleBuild}>
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>
      )}

      {tab === "improve" && (
        <div>
          <textarea
            placeholder="Post"
            value={improveForm.post}
            onChange={(e) =>
              setImproveForm({ ...improveForm, post: e.target.value })
            }
          />

          <input
            placeholder="Goal"
            value={improveForm.goal}
            onChange={(e) =>
              setImproveForm({ ...improveForm, goal: e.target.value })
            }
          />

          <button onClick={handleImprove}>
            {loading ? "Loading..." : "Improve"}
          </button>
        </div>
      )}

      {tab === "analyze" && (
        <div>
          <textarea
            placeholder="Post"
            value={analyzeForm.post}
            onChange={(e) =>
              setAnalyzeForm({ ...analyzeForm, post: e.target.value })
            }
          />

          <button onClick={handleAnalyze}>
            {loading ? "Loading..." : "Analyze"}
          </button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          <h2>Result</h2>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      <hr />

      <h2>History</h2>
      {history.map((item) => (
        <div key={item._id}>
          <small>{item.type}</small>
          <pre>{JSON.stringify(item.content, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
