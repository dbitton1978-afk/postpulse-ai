import { useEffect, useState } from "react";

function createId() {
  return `${Date.now()}-${Math.random()}`;
}

// 🔥 AI BUILDER
function buildAIStory(text) {
  if (!text) return [[]];

  const sentences = text.split(/[.!?\n]/).filter(Boolean);

  const hook = sentences[0] || text.slice(0, 60);
  const value = sentences.slice(1, 3).join(" ") || text;
  const cta =
    sentences.slice(3).join(" ") ||
    "שלחו הודעה עכשיו / הקליקו לפרטים";

  return [
    [
      {
        id: createId(),
        type: "text",
        x: 180,
        y: 260,
        scale: 1.4,
        content: hook
      },
      {
        id: createId(),
        type: "emoji",
        x: 180,
        y: 420,
        scale: 1.2,
        content: "🔥"
      }
    ],

    [
      {
        id: createId(),
        type: "text",
        x: 180,
        y: 320,
        scale: 1,
        content: value
      },
      {
        id: createId(),
        type: "emoji",
        x: 60,
        y: 560,
        scale: 1.2,
        content: "💡"
      }
    ],

    [
      {
        id: createId(),
        type: "text",
        x: 180,
        y: 300,
        scale: 1.2,
        content: cta
      },
      {
        id: createId(),
        type: "emoji",
        x: 300,
        y: 500,
        scale: 1.3,
        content: "👉"
      }
    ]
  ];
}

export default function StoryEditor({
  incomingText = "",
  incomingTextToken = 0
}) {
  const [slides, setSlides] = useState([[]]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    if (!incomingTextToken) return;
  }, [incomingText, incomingTextToken]);

  const layers = slides[currentSlide] || [];

  function updateLayers(newLayers) {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === currentSlide ? newLayers : slide
      )
    );
  }

  // 🔥 AI BUTTON
  function generateAIStory() {
    const aiSlides = buildAIStory(incomingText);
    setSlides(aiSlides);
    setCurrentSlide(0);
    setSelectedId(null);
  }

  function handleMouseDown(id) {
    setSelectedId(id);
    setDragId(id);
  }

  function handleMouseMove(e) {
    if (!dragId) return;

    const rect = e.currentTarget.getBoundingClientRect();

    updateLayers(
      layers.map((l) =>
        l.id === dragId
          ? {
              ...l,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            }
          : l
      )
    );
  }

  function handleMouseUp() {
    setDragId(null);
  }

  function scaleSelected(delta) {
    if (!selectedId) return;

    updateLayers(
      layers.map((l) =>
        l.id === selectedId
          ? { ...l, scale: Math.max(0.5, Math.min(3, l.scale + delta)) }
          : l
      )
    );
  }

  function deleteSelected() {
    updateLayers(layers.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }

  function updateText(val) {
    updateLayers(
      layers.map((l) =>
        l.id === selectedId ? { ...l, content: val } : l
      )
    );
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h2>AI Story Builder 🚀</h2>

      {/* 🔥 AI BUTTON */}
      <button onClick={generateAIStory}>
        צור סטורי אוטומטי
      </button>

      {/* SLIDES */}
      <div style={{ marginTop: 10 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              marginRight: 5,
              background: i === currentSlide ? "#00ffcc" : "#333"
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div style={{ marginTop: 10 }}>
        <button onClick={() => scaleSelected(0.1)}>+</button>
        <button onClick={() => scaleSelected(-0.1)}>-</button>
        <button onClick={deleteSelected}>מחק</button>
      </div>

      {/* EDIT */}
      {layers.find((l) => l.id === selectedId) && (
        <input
          value={layers.find((l) => l.id === selectedId).content}
          onChange={(e) => updateText(e.target.value)}
        />
      )}

      {/* CANVAS */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          width: 360,
          height: 640,
          background: "#111",
          position: "relative",
          marginTop: 20
        }}
      >
        {layers.map((l) => (
          <div
            key={l.id}
            onMouseDown={() => handleMouseDown(l.id)}
            style={{
              position: "absolute",
              left: l.x,
              top: l.y,
              transform: `translate(-50%, -50%) scale(${l.scale})`,
              color: "white",
              textAlign: "center",
              background: "rgba(0,0,0,0.4)",
              padding: 8,
              border:
                selectedId === l.id ? "2px solid #00ffcc" : "none"
            }}
          >
            {l.content}
          </div>
        ))}
      </div>
    </div>
  );
}
