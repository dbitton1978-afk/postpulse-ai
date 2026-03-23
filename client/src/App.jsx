import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [mode, setMode] = useState("generate");

  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [postToImprove, setPostToImprove] = useState("");
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveResult, setImproveResult] = useState(null);

  const generatePost = async () => {
    if (!topic) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic,
          language: "he",
          style: "mentor"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      setResult(data.post || "לא התקבלה תשובה");
    } catch (err) {
      setResult("שגיאה ביצירת הפוסט");
    }

    setLoading(false);
  };

  const improvePost = async () => {
    if (!postToImprove) return;

    setImproveLoading(true);
    setImproveResult(null);

    try {
      const res = await fetch(`${API_URL}/improve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          post: postToImprove
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      setImproveResult(data.data || null);
    } catch (err) {
      setImproveResult({
        error: "שגיאה בשיפור הפוסט"
      });
    }

    setImproveLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>PostPulse AI 🚀</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setMode("generate")}>יצירת פוסט</button>
        <button onClick={() => setMode("improve")}>שיפור פוסט</button>
      </div>

      {mode === "generate" && (
        <div>
          <textarea
            placeholder="כתוב רעיון לפוסט..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <button onClick={generatePost}>
            {loading ? "טוען..." : "צור פוסט"}
          </button>

          <div style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
            {result}
          </div>
        </div>
      )}

      {mode === "improve" && (
        <div>
          <textarea
            placeholder="הדבק כאן פוסט קיים..."
            value={postToImprove}
            onChange={(e) => setPostToImprove(e.target.value)}
            rows={6}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <button onClick={improvePost}>
            {improveLoading ? "משפר..." : "שפר פוסט"}
          </button>

          {improveResult?.error && (
            <div style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
              {improveResult.error}
            </div>
          )}

          {improveResult && !improveResult.error && (
            <div style={{ marginTop: 20 }}>
              <h3>חוזקות</h3>
              <ul>
                {(improveResult.strengths || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h3>חולשות</h3>
              <ul>
                {(improveResult.weaknesses || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h3>גרסה משופרת</h3>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {improveResult.improvedPost}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
