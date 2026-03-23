import { useState } from "react";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export default function StoryEditor() {
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            id: createId(),
            src: reader.result,
            x: 180,
            y: 320,
            scale: 1
          }
        ]);
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
  }

  function addText() {
    const id = createId();

    setTexts((prev) => [
      ...prev,
      {
        id,
        content: "טקסט חדש",
        x: 180,
        y: 100,
        scale: 1
      }
    ]);

    setSelectedId(id);
    setSelectedType("text");
  }

  function removeSelected() {
    if (!selectedId || !selectedType) return;

    if (selectedType === "image") {
      setImages((prev) => prev.filter((item) => item.id !== selectedId));
    }

    if (selectedType === "text") {
      setTexts((prev) => prev.filter((item) => item.id !== selectedId));
    }

    setSelectedId(null);
    setSelectedType(null);
  }

  function handleMouseDown(id, type) {
    setSelectedId(id);
    setSelectedType(type);
    setDragItem({ id, type });
  }

  function handleMouseUp() {
    setDragItem(null);
  }

  function handleMouseMove(e) {
    if (!dragItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragItem.type === "image") {
      setImages((prev) =>
        prev.map((item) =>
          item.id === dragItem.id ? { ...item, x, y } : item
        )
      );
    }

    if (dragItem.type === "text") {
      setTexts((prev) =>
        prev.map((item) =>
          item.id === dragItem.id ? { ...item, x, y } : item
        )
      );
    }
  }

  function scaleSelected(delta) {
    if (!selectedId || !selectedType) return;

    if (selectedType === "image") {
      setImages((prev) =>
        prev.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                scale: Math.min(3, Math.max(0.3, item.scale + delta))
              }
            : item
        )
      );
    }

    if (selectedType === "text") {
      setTexts((prev) =>
        prev.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                scale: Math.min(3, Math.max(0.3, item.scale + delta))
              }
            : item
        )
      );
    }
  }

  function updateSelectedText(value) {
    if (selectedType !== "text" || !selectedId) return;

    setTexts((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, content: value } : item
      )
    );
  }

  const selectedText =
    selectedType === "text"
      ? texts.find((item) => item.id === selectedId)
      : null;

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor - Step 3</h2>

      <input type="file" accept="image/*" multiple onChange={handleUpload} />

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={addText}>הוסף טקסט</button>
        <button onClick={() => scaleSelected(0.1)} disabled={!selectedId}>
          הגדל +
        </button>
        <button onClick={() => scaleSelected(-0.1)} disabled={!selectedId}>
          הקטן -
        </button>
        <button onClick={removeSelected} disabled={!selectedId}>
          מחק נבחר
        </button>
      </div>

      {selectedText && (
        <div style={{ marginTop: 10 }}>
          <input
            value={selectedText.content}
            onChange={(e) => updateSelectedText(e.target.value)}
            style={{ padding: 8, width: 220 }}
          />
        </div>
      )}

      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          marginTop: 20,
          width: 360,
          height: 640,
          background: "#111",
          position: "relative",
          overflow: "hidden",
          borderRadius: 20
        }}
      >
        {images.map((img) => (
          <img
            key={img.id}
            src={img.src}
            alt=""
            draggable={false}
            onMouseDown={() => handleMouseDown(img.id, "image")}
            style={{
              position: "absolute",
              left: img.x,
              top: img.y,
              width: 200,
              height: 200,
              objectFit: "cover",
              transform: `translate(-50%, -50%) scale(${img.scale})`,
              border:
                selectedId === img.id && selectedType === "image"
                  ? "3px solid #00ffcc"
                  : "none",
              cursor: "grab",
              userSelect: "none"
            }}
          />
        ))}

        {texts.map((txt) => (
          <div
            key={txt.id}
            onMouseDown={() => handleMouseDown(txt.id, "text")}
            style={{
              position: "absolute",
              left: txt.x,
              top: txt.y,
              transform: `translate(-50%, -50%) scale(${txt.scale})`,
              color: "white",
              background: "rgba(0,0,0,0.4)",
              padding: "8px 12px",
              borderRadius: 10,
              border:
                selectedId === txt.id && selectedType === "text"
                  ? "2px solid #00ffcc"
                  : "none",
              cursor: "grab",
              userSelect: "none",
              maxWidth: 240,
              textAlign: "center",
              whiteSpace: "pre-wrap"
            }}
          >
            {txt.content}
          </div>
        ))}
      </div>
    </div>
  );
}
