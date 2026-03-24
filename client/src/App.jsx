import { useState } from "react";
import StoryEditor from "./components/StoryEditor";

export default function App() {
  const [text, setText] = useState("");
  const [storyText, setStoryText] = useState("");
  const [token, setToken] = useState(0);

  function sendToStory() {
    if (!text.trim()) return;
    setStoryText(text);
    setToken(Date.now());
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>PostPulse AI 🚀</h1>

      {/* טקסט לבדיקה */}
      <textarea
        placeholder="כתוב פה פוסט לבדיקה"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: 300,
          height: 100,
          display: "block",
          marginBottom: 10
        }}
      />

      <button onClick={sendToStory}>
        שלח לסטורי
      </button>

      {/* עורך */}
      <div style={{ marginTop: 40 }}>
        <StoryEditor
          incomingText={storyText}
          incomingTextToken={token}
        />
      </div>
    </div>
  );
}
