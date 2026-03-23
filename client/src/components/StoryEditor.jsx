import { useState } from "react";

function createId() {
  return Date.now().toString();
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
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
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

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === dragId
          ? {
              ...layer,
              x: e.nativeEvent.offsetX,
              y: e.nativeEvent.offsetY
            }
          : layer
      )
    );
  }

  function handleWheel(e) {
    if (!selectedId) return;

    e.preventDefault();

    const delta = e.deltaY * -0.001;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedId
          ? {
              ...layer,
              scale: Math.min(Math.max(0.5, layer.scale + delta), 3)
            }
          : layer
      )
    );
  }

  function updateText(value) {
    if (!selectedId) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedId
          ? { ...layer, content: value }
          : layer
      )
    );
  }

  const selectedLayer = layers.find((l) => l.id === selectedId);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor (Pro)</h2>

      <input type="file" accept="image/*" onChange={handleUpload} />

      <div style={{ marginTop: 10 }}>
        <button onClick={addText}>הוסף טקסט</button>
        <button onClick={addEmoji}>הוסף אימוג׳י</button>
        <button onClick={deleteLayer} disabled={!selectedId}>
          מחק אלמנט
        </button>
      </div>

      {selectedLayer && selectedLayer.type === "text" && (
        <div style={{ marginTop: 10 }}>
          <input
            value={selectedLayer.content}
            onChange={(e) => updateText(e.target.value)}
            style={{ padding: 8, width: 200 }}
          />
        </div>
      )}

      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
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
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
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
              transform: `scale(${layer.scale})`,
              color: "white",
              fontSize: layer.type === "emoji" ? 40 : 24,
              cursor: "grab",
              userSelect: "none",
              border:
                selectedId === layer.id
                  ? "2px solid #00ffcc"
                  : "none",
              padding: 4
            }}
          >
            {layer.content}
          </div>
        ))}
      </div>
    </div>
  );
}
