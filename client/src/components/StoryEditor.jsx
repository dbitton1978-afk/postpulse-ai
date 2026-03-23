import { useState } from "react";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export default function StoryEditor() {
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);

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

  function removeImage(id) {
    setImages((prev) => prev.filter((img) => img.id !== id));
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

    setImages((prev) =>
      prev.map((img) =>
        img.id === dragId ? { ...img, x, y } : img
      )
    );
  }

  function scaleSelected(delta) {
    if (!selectedId) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === selectedId
          ? {
              ...img,
              scale: Math.min(3, Math.max(0.3, img.scale + delta))
            }
          : img
      )
    );
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor - Step 2</h2>

      {/* העלאת תמונה */}
      <input type="file" accept="image/*" multiple onChange={handleUpload} />

      {/* כפתורים */}
      <div style={{ marginTop: 10 }}>
        <button onClick={() => scaleSelected(0.1)} disabled={!selectedId}>
          הגדל +
        </button>
        <button onClick={() => scaleSelected(-0.1)} disabled={!selectedId}>
          הקטן -
        </button>
        <button
          onClick={() => removeImage(selectedId)}
          disabled={!selectedId}
        >
          מחק נבחר
        </button>
      </div>

      {/* קנבס */}
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
            onMouseDown={() => handleMouseDown(img.id)}
            style={{
              position: "absolute",
              left: img.x,
              top: img.y,
              width: 200,
              height: 200,
              objectFit: "cover",
              transform: `translate(-50%, -50%) scale(${img.scale})`,
              border:
                selectedId === img.id ? "3px solid #00ffcc" : "none",
              cursor: "grab",
              userSelect: "none"
            }}
          />
        ))}
      </div>
    </div>
  );
}
