import { useState } from "react";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function StoryEditor() {
  const [background, setBackground] = useState(null);
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBackground(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function addText() {
    const id = createId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "text",
        x: 100,
        y: 100,
        scale: 1,
        content: "טקסט חדש"
      }
    ]);
    setSelectedId(id);
  }

  function addEmoji() {
    const id = createId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "emoji",
        x: 120,
        y: 150,
        scale: 1,
        content: "🔥"
      }
    ]);
    setSelectedId(id);
  }

  function deleteLayer() {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((layer) => layer.id !== selectedId));
    setSelectedId(null);
  }

  function handleMouseDown(id) {
    setSelectedId(id);
    setDragId(id);
  }

  function handleMouseUp() {
    setDragId(null);
  }

  function handleMouseMove(e) {
    if (!dragId) return;

    const container = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - container.left;
    const y = e.clientY - container.top;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === dragId
          ? {
              ...layer,
              x,
              y
            }
          : layer
      )
    );
  }

  function updateText(value) {
    if (!selectedId) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedId ? { ...layer, content: value } : layer
      )
    );
  }

  function scaleSelected(delta) {
    if (!selectedId) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedId
          ? {
              ...layer,
              scale: Math.min(3, Math.max(0.5, (layer.scale || 1) + delta))
            }
          : layer
      )
    );
  }

  const selectedLayer = layers.find((layer) => layer.id === selectedId);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor (Pro)</h2>

      <input type="file" accept="image/*" onChange={handleUpload} />

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={addText}>הוסף טקסט</button>
        <button onClick={addEmoji}>הוסף אימוג׳י</button>
        <button onClick={() => scaleSelected(0.1)} disabled={!selectedId}>
          הגדל +
        </button>
        <button onClick={() => scaleSelected(-0.1)} disabled={!selectedId}>
          הקטן -
        </button>
        <button onClick={deleteLayer} disabled={!selectedId}>
          מחק אלמנט
        </button>
      </div>

      {selectedLayer && selectedLayer.type === "text" && (
        <div style={{ marginTop: 10 }}>
          <input
            value={selectedLayer.content}
            onChange={(e) => updateText(e.target.value)}
            style={{ padding: 8, width: 220 }}
          />
        </div>
      )}

      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: "relative",
          width: 360,
          height: 640,
          background: "#222",
          marginTop: 20,
          overflow: "hidden",
          border: "2px solid #444"
        }}
      >
        {background && (
          <img
            src={background}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none"
            }}
          />
        )}

        {layers.map((layer) => (
          <div
            key={layer.id}
            onMouseDown={() => handleMouseDown(layer.id)}
            style={{
              position: "absolute",
              left: layer.x,
              top: layer.y,
              transform: `translate(-50%, -50%) scale(${layer.scale || 1})`,
              transformOrigin: "center center",
              color: "white",
              fontSize: layer.type === "emoji" ? 40 : 24,
              cursor: "grab",
              userSelect: "none",
              border: selectedId === layer.id ? "2px solid #00ffcc" : "none",
              padding: 4,
              whiteSpace: "nowrap"
            }}
          >
            {layer.content}
          </div>
        ))}
      </div>
    </div>
  );
}
