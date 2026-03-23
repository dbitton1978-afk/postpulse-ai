import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ===== AI SPLIT =====
function splitText(text) {
  if (!text) return [];

  const parts = text
    .split(/[.!?\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

  return parts.slice(0, 3);
}

// ===== THEME =====
function getTheme(text) {
  const t = text.toLowerCase();

  if (t.includes("sale") || t.includes("מבצע"))
    return "linear-gradient(135deg,#111,#7f1d1d,#f97316)";

  if (t.includes("tip") || t.includes("ללמוד"))
    return "linear-gradient(135deg,#111,#1d4ed8,#38bdf8)";

  if (t.includes("love") || t.includes("אהבה"))
    return "linear-gradient(135deg,#4c1d95,#be185d,#fb7185)";

  return "linear-gradient(135deg,#111,#312e81,#7c3aed)";
}

export default function StoryEditor({
  incomingText = "",
  incomingTextToken = 0
}) {
  const [slides, setSlides] = useState([
    { bg: "#111", layers: [] }
  ]);
  const [current, setCurrent] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);

  const canvasRef = useRef();

  // ===== AI STORY =====
  useEffect(() => {
    if (!incomingTextToken) return;

    const parts = splitText(incomingText);
    const bg = getTheme(incomingText);

    const newSlides = parts.map((p, i) => ({
      bg,
      layers: [
        {
          id: createId(),
          type: "text",
          x: 180,
          y: i === 0 ? 260 : i === 1 ? 320 : 520,
          scale: i === 0 ? 1.4 : 1,
          content: p,
          color: "#fff",
          bgColor: "rgba(0,0,0,0.4)",
          align: "center",
          font: "Arial"
        }
      ]
    }));

    setSlides(newSlides.length ? newSlides : [{ bg, layers: [] }]);
    setCurrent(0);
    setSelectedId(null);
  }, [incomingTextToken]);

  const layers = slides[current]?.layers || [];

  function updateLayers(newLayers) {
    setSlides((prev) =>
      prev.map((s, i) =>
        i === current ? { ...s, layers: newLayers } : s
      )
    );
  }

  // ===== DRAG =====
  function handleMove(e) {
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

  // ===== CONTROLS =====
  function updateSelected(key, value) {
    updateLayers(
      layers.map((l) =>
        l.id === selectedId ? { ...l, [key]: value } : l
      )
    );
  }

  function scale(delta) {
    if (!selectedId) return;

    updateSelected(
      "scale",
      Math.min(3, Math.max(0.5,
        (layers.find((l) => l.id === selectedId)?.scale || 1) + delta
      ))
    );
  }

  function rotate(delta) {
    if (!selectedId) return;

    updateSelected(
      "rotation",
      ((layers.find((l) => l.id === selectedId)?.rotation || 0) + delta)
    );
  }

  function remove() {
    updateLayers(layers.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }

  // ===== EXPORT =====
  async function exportImage() {
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: null,
      scale: 2
    });

    const link = document.createElement("a");
    link.download = `story-${current + 1}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Story Builder 🚀</h2>

      {/* NAV */}
      <div style={{ display: "flex", gap: 5 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              background: i === current ? "#00ffcc" : "#333"
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div style={{ marginTop: 10 }}>
        <button onClick={() => scale(0.1)}>+</button>
        <button onClick={() => scale(-0.1)}>-</button>
        <button onClick={() => rotate(10)}>⟳</button>
        <button onClick={remove}>🗑</button>
        <button onClick={exportImage}>Export</button>
      </div>

      {/* TEXT STYLE */}
      {selectedId && (
        <div style={{ marginTop: 10, display: "flex", gap: 5 }}>
          <input
            type="color"
            onChange={(e) =>
              updateSelected("color", e.target.value)
            }
          />
          <input
            type="color"
            onChange={(e) =>
              updateSelected("bgColor", e.target.value + "88")
            }
          />
          <select
            onChange={(e) =>
              updateSelected("align", e.target.value)
            }
          >
            <option value="left">שמאל</option>
            <option value="center">מרכז</option>
            <option value="right">ימין</option>
          </select>
          <select
            onChange={(e) =>
              updateSelected("font", e.target.value)
            }
          >
            <option>Arial</option>
            <option>Impact</option>
            <option>Tahoma</option>
          </select>
        </div>
      )}

      {/* CANVAS */}
      <div
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseUp={() => setDragId(null)}
        style={{
          width: 360,
          height: 640,
          marginTop: 20,
          background: slides[current]?.bg,
          position: "relative",
          borderRadius: 20,
          overflow: "hidden"
        }}
      >
        {layers.map((l) => (
          <div
            key={l.id}
            onMouseDown={() => {
              setSelectedId(l.id);
              setDragId(l.id);
            }}
            style={{
              position: "absolute",
              left: l.x,
              top: l.y,
              transform: `translate(-50%,-50%) scale(${l.scale}) rotate(${l.rotation || 0}deg)`,
              color: l.color,
              background: l.bgColor,
              padding: 10,
              borderRadius: 10,
              textAlign: l.align,
              fontFamily: l.font,
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
