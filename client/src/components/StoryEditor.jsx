import { useState } from "react";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function StoryEditor() {
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);

  function handleUploadImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = () => {
        const id = createId() + "-" + index;

        setLayers((prev) => [
          ...prev,
          {
            id,
            type: "image",
            x: 180,
            y: 320,
            scale: 1,
            src: reader.result,
            width: 180,
            height: 180
          }
        ]);

        setSelectedId(id);
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
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

  function deleteSelectedLayer() {
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

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
        layer.id === selectedId && layer.type === "text"
          ? { ...layer, content: value }
          : layer
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
              scale: Math.min(3, Math.max(0.3, (layer.scale || 1) + delta))
            }
          : layer
      )
    );
  }

  function bringSelectedToFront() {
    if (!selectedId) return;

    setLayers((prev) => {
      const selected = prev.find((layer) => layer.id === selectedId);
      const others = prev.filter((layer) => layer.id !== selectedId);
      return selected ? [...others, selected] : prev;
    });
  }

  const selectedLayer = layers.find((layer) => layer.id === selectedId);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor (Multi Image)</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUploadImages}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 10,
          border: "1px solid #444",
          borderRadius: 8
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: "bold" }}>אלמנטים</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={addText}>הוסף טקסט</button>
          <button onClick={addEmoji}>הוסף אימוג׳י</button>
          <button onClick={() => scaleSelected(0.1)} disabled={!selectedId}>
            הגדל +
          </button>
          <button onClick={() => scaleSelected(-0.1)} disabled={!selectedId}>
            הקטן -
          </button>
          <button onClick={bringSelectedToFront} disabled={!selectedId}>
            הבא לקדימה
          </button>
          <button onClick={deleteSelectedLayer} disabled={!selectedId}>
            מחק נבחר
          </button>
        </div>
      </div>

      {selectedLayer && selectedLayer.type === "text" && (
        <div style={{ marginTop: 12 }}>
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
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedId(null);
          }
        }}
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
        {layers.map((layer) => {
          if (layer.type === "image") {
            return (
              <img
                key={layer.id}
                src={layer.src}
                alt=""
                draggable={false}
                onMouseDown={() => handleMouseDown(layer.id)}
                style={{
                  position: "absolute",
                  left: layer.x,
                  top: layer.y,
                  width: layer.width,
                  height: layer.height,
                  objectFit: "cover",
                  transform: `translate(-50%, -50%) scale(${layer.scale || 1})`,
                  transformOrigin: "center center",
                  border: selectedId === layer.id ? "3px solid #00ffcc" : "none",
                  cursor: "grab",
                  userSelect: "none",
                  zIndex: selectedId === layer.id ? 10 : 1
                }}
              />
            );
          }

          return (
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
                whiteSpace: "nowrap",
                zIndex: selectedId === layer.id ? 10 : 2
              }}
            >
              {layer.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
