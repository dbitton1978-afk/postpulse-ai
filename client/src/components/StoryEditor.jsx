import { useMemo, useState } from "react";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const DEFAULT_TEXT = {
  content: "טקסט חדש",
  x: 180,
  y: 100,
  scale: 1,
  color: "#ffffff",
  bgColor: "#000000",
  bgOpacity: 0.4,
  align: "center",
  font: "Arial"
};

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
        ...DEFAULT_TEXT
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
    setDragItem(null);
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

  function updateStyle(key, value) {
    if (selectedType !== "text" || !selectedId) return;

    setTexts((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, [key]: value } : item
      )
    );
  }

  const selectedText = useMemo(() => {
    if (selectedType !== "text") return null;
    return texts.find((item) => item.id === selectedId) || null;
  }, [texts, selectedId, selectedType]);

  function hexToRgba(hex, opacity) {
    if (!hex) return `rgba(0,0,0,${opacity})`;

    const safeHex = hex.replace("#", "");
    const bigint = parseInt(safeHex, 16);

    if (safeHex.length !== 6 || Number.isNaN(bigint)) {
      return `rgba(0,0,0,${opacity})`;
    }

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor - Step 4</h2>

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
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <input
            value={selectedText.content}
            onChange={(e) => updateSelectedText(e.target.value)}
            style={{ padding: 8, minWidth: 220 }}
          />

          <label>
            צבע טקסט{" "}
            <input
              type="color"
              value={selectedText.color}
              onChange={(e) => updateStyle("color", e.target.value)}
            />
          </label>

          <label>
            צבע רקע{" "}
            <input
              type="color"
              value={selectedText.bgColor}
              onChange={(e) => updateStyle("bgColor", e.target.value)}
            />
          </label>

          <label>
            שקיפות{" "}
            <select
              value={String(selectedText.bgOpacity)}
              onChange={(e) => updateStyle("bgOpacity", Number(e.target.value))}
            >
              <option value="0">בלי רקע</option>
              <option value="0.2">20%</option>
              <option value="0.4">40%</option>
              <option value="0.6">60%</option>
              <option value="0.8">80%</option>
              <option value="1">100%</option>
            </select>
          </label>

          <label>
            יישור{" "}
            <select
              value={selectedText.align}
              onChange={(e) => updateStyle("align", e.target.value)}
            >
              <option value="left">שמאל</option>
              <option value="center">מרכז</option>
              <option value="right">ימין</option>
            </select>
          </label>

          <label>
            פונט{" "}
            <select
              value={selectedText.font}
              onChange={(e) => updateStyle("font", e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Impact">Impact</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </label>
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
              color: txt.color,
              background: hexToRgba(txt.bgColor, txt.bgOpacity),
              padding: "8px 12px",
              borderRadius: 10,
              textAlign: txt.align,
              fontFamily: txt.font,
              border:
                selectedId === txt.id && selectedType === "text"
                  ? "2px solid #00ffcc"
                  : "none",
              cursor: "grab",
              userSelect: "none",
              maxWidth: 240,
              whiteSpace: "pre-wrap",
              lineHeight: 1.3
            }}
          >
            {txt.content}
          </div>
        ))}
      </div>
    </div>
  );
}
