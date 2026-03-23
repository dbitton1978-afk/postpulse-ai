import { useEffect, useState } from "react";

function createId() {
  return `${Date.now()}-${Math.random()}`;
}

function splitText(text) {
  if (!text) return [];

  const sentences = text.split(/[.!?\n]/).filter(Boolean);

  const chunks = [];
  let current = "";

  sentences.forEach((s) => {
    if ((current + s).length < 100) {
      current += s + " ";
    } else {
      chunks.push(current.trim());
      current = s + " ";
    }
  });

  if (current) chunks.push(current.trim());

  return chunks.slice(0, 4); // מקסימום 4 שקופיות
}

export default function StoryEditor({
  incomingText = "",
  incomingTextToken = 0
}) {
  const [slides, setSlides] = useState([[]]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);

  // 🔥 פיצול אוטומטי
  useEffect(() => {
    if (!incomingText || !incomingTextToken) return;

    const parts = splitText(incomingText);

    const newSlides = parts.map((part) => {
      const id = createId();

      return [
        {
          id,
          type: "text",
          x: 180,
          y: 320,
          scale: 1,
          maxWidth: 260,
          content: part
        }
      ];
    });

    setSlides(newSlides.length ? newSlides : [[]]);
    setCurrentSlide(0);
    setSelectedId(null);
  }, [incomingText, incomingTextToken]);

  const layers = slides[currentSlide] || [];

  function updateLayers(newLayers) {
    setSlides((prev) =>
      prev.map((slide, index) =>
        index === currentSlide ? newLayers : slide
      )
    );
  }

  function addText() {
    const id = createId();

    updateLayers([
      ...layers,
      {
        id,
        type: "text",
        x: 180,
        y: 560,
        scale: 1,
        maxWidth: 260,
        content: "טקסט חדש"
      }
    ]);

    setSelectedId(id);
  }

  function handleMouseDown(id) {
    setSelectedId(id);
    setDragId(id);
  }

  function handleMouseMove(e) {
    if (!dragId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateLayers(
      layers.map((layer) =>
        layer.id === dragId ? { ...layer, x, y } : layer
      )
    );
  }

  function handleMouseUp() {
    setDragId(null);
  }

  function scaleSelected(delta) {
    if (!selectedId) return;

    updateLayers(
      layers.map((layer) =>
        layer.id === selectedId
          ? {
              ...layer,
              scale: Math.min(3, Math.max(0.5, layer.scale + delta))
            }
          : layer
      )
    );
  }

  function deleteSelected() {
    updateLayers(layers.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }

  function updateText(value) {
    updateLayers(
      layers.map((l) =>
        l.id === selectedId ? { ...l, content: value } : l
      )
    );
  }

  function addSlide() {
    setSlides((prev) => [...prev, []]);
    setCurrentSlide(slides.length);
  }

  function deleteSlide() {
    if (slides.length === 1) return;

    const newSlides = slides.filter((_, i) => i !== currentSlide);
    setSlides(newSlides);
    setCurrentSlide(Math.max(0, currentSlide - 1));
  }

  const selectedLayer = layers.find((l) => l.id === selectedId);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Slides Editor</h2>

      {/* ניווט שקופיות */}
      <div style={{ display: "flex", gap: 6 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              background: i === currentSlide ? "#00ffcc" : "#333",
              color: "black"
            }}
          >
            {i + 1}
          </button>
        ))}

        <button onClick={addSlide}>+</button>
        <button onClick={deleteSlide}>🗑</button>
      </div>

      {/* כפתורים */}
      <div style={{ marginTop: 10 }}>
        <button onClick={addText}>הוסף טקסט</button>
        <button onClick={() => scaleSelected(0.1)}>+</button>
        <button onClick={() => scaleSelected(-0.1)}>-</button>
        <button onClick={deleteSelected}>מחק</button>
      </div>

      {selectedLayer && (
        <input
          value={selectedLayer.content}
          onChange={(e) => updateText(e.target.value)}
          style={{ marginTop: 10 }}
        />
      )}

      {/* קנבס */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "relative",
          width: 360,
          height: 640,
          background: "#222",
          marginTop: 20,
          border: "2px solid #444"
        }}
      >
        {layers.map((layer) => (
          <div
            key={layer.id}
            onMouseDown={() => handleMouseDown(layer.id)}
            style={{
              position: "absolute",
              left: layer.x,
              top: layer.y,
              transform: `translate(-50%, -50%) scale(${layer.scale})`,
              color: "white",
              maxWidth: layer.maxWidth,
              textAlign: "center",
              background: "rgba(0,0,0,0.4)",
              padding: 8,
              border:
                selectedId === layer.id
                  ? "2px solid #00ffcc"
                  : "none"
            }}
          >
            {layer.content}
          </div>
        ))}
      </div>
    </div>
  );
}
