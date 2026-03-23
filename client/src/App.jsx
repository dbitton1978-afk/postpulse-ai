import { useState } from "react";

export default function App() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePost = async () => {
    if (!topic) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("http://localhost:5000/generate", {
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
      setResult(data.post);
    } catch (err) {
      setResult("שגיאה ביצירת הפוסט");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>PostPulse AI 🚀</h1>

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
  );
}
