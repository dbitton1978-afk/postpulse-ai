import { useState } from "react";

function createId() {
  return Date.now().toString();
}

export default function StoryEditor() {
  const [background, setBackground] = useState(null);
  const [layers, setLayers] = useState([]);
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
    setLayers((prev) => [
      ...prev,
      {
        id: createId(),
        type: "text",
        x: 100,
        y: 100,
        content: "טקסט חדש"
      }
    ]);
  }

  function addEmoji() {
    setLayers((prev) => [
      ...prev,
      {
        id: createId(),
        type: "emoji",
        x: 120,
        y: 150,
        content: "🔥"
      }
    ]);
  }

  function handleMouseDown(id) {
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

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor (MVP)</h2>

      <input type="file" accept="image/*" onChange={handleUpload} />

      <div style={{ marginTop: 10 }}>
        <button onClick={addText}>הוסף טקסט</button>
        <button onClick={addEmoji}>הוסף אימוג׳י</button>
      </div>

      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "relative",
          width: 360,
          height: 640,
          background: "#222",
          marginTop: 20,
          overflow: "hidden"
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
              color: "white",
              fontSize: layer.type === "emoji" ? 40 : 24,
              cursor: "grab",
              userSelect: "none"
            }}
          >
            {layer.content}
          </div>
        ))}
      </div>
    </div>
  );
}
