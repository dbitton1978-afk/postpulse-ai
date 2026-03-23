import { useEffect, useState } from "react";

function createId() {
  return `${Date.now()}-${Math.random()}`;
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
    if (!incomingText || !incomingTextToken) return;

    const id = createId();

    setSlides([
      [
        {
          id,
          type: "text",
          x: 180,
          y: 320,
          scale: 1.2,
          content: incomingText,
          color: "#ffffff",
          bgColor: "rgba(0,0,0,0.4)",
          align: "center",
          fontFamily: "Arial"
        }
      ]
    ]);

    setCurrentSlide(0);
    setSelectedId(id);
  }, [incomingText, incomingTextToken]);

  const layers = slides[currentSlide] || [];

  function updateLayers(newLayers) {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === currentSlide ? newLayers : slide
      )
    );
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

  function updateSelected(prop, value) {
    updateLayers(
      layers.map((l) =>
        l.id === selectedId ? { ...l, [prop]: value } : l
      )
    );
  }

  const selected = layers.find((l) => l.id === selectedId);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Text Design 🎨</h2>

      {/* 🎛️ CONTROLS */}
      {selected && selected.type === "text" && (
        <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
          
          {/* צבע טקסט */}
          <input
            type="color"
            value={selected.color}
            onChange={(e) => updateSelected("color", e.target.value)}
          />

          {/* צבע רקע */}
          <input
            type="color"
            onChange={(e) =>
              updateSelected("bgColor", e.target.value + "88")
            }
          />

          {/* יישור */}
          <select
            value={selected.align}
            onChange={(e) => updateSelected("align", e.target.value)}
          >
            <option value="left">שמאל</option>
            <option value="center">מרכז</option>
            <option value="right">ימין</option>
          </select>

          {/* פונטים */}
          <select
            value={selected.fontFamily}
            onChange={(e) =>
              updateSelected("fontFamily", e.target.value)
            }
          >
            <option value="Arial">Arial</option>
            <option value="Impact">Impact</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Courier New">Courier</option>
          </select>

          {/* גודל */}
          <button onClick={() => updateSelected("scale", selected.scale + 0.1)}>+</button>
          <button onClick={() => updateSelected("scale", selected.scale - 0.1)}>-</button>
        </div>
      )}

      {/* 🎬 CANVAS */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          width: 360,
          height: 640,
          background: "#111",
          position: "relative"
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
              color: l.color,
              background: l.bgColor,
              padding: "10px 16px",
              borderRadius: 12,
              textAlign: l.align,
              fontFamily: l.fontFamily,
              maxWidth: 260,
              cursor: "grab",
              border:
                selectedId === l.id
                  ? "2px solid #00ffcc"
                  : "none"
            }}
          >
            {l.content}
          </div>
        ))}
      </div>
    </div>
  );
}
