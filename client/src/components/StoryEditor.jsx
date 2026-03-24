import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const FONTS = ["Arial", "Impact", "Tahoma", "Courier New"];

const FILTERS = {
  normal: "none",
  smooth: "blur(1px) brightness(1.08)",
  beauty: "brightness(1.18) contrast(1.08) saturate(1.15)",
  bw: "grayscale(1)",
  vintage: "sepia(0.65)",
  cartoon: "contrast(1.8) saturate(1.8)",
  mosaic: "blur(4px)",
  neon: "brightness(1.25) saturate(2)",
  dark: "brightness(0.65)",
  warm: "sepia(0.3) saturate(1.35)"
};

export default function StoryEditor({
  incomingText,
  incomingTextToken,
  onExportReady
}) {
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const canvasRef = useRef();

  const selectedText = useMemo(
    () => texts.find((t) => t.id === selectedId),
    [texts, selectedId]
  );

  // ===== הכנסת טקסט =====
  useEffect(() => {
    if (!incomingText) return;

    const id = createId();

    setTexts((prev) => [
      ...prev,
      {
        id,
        content: incomingText,
        x: 180,
        y: 300,
        scale: 1,
        color: "#ffffff",
        bgColor: "#000000",
        align: "center",
        font: "Arial"
      }
    ]);

    setSelectedId(id);
    setSelectedType("text");
  }, [incomingTextToken]);

  // ===== export =====
  async function exportImage() {
    const canvas = await html2canvas(canvasRef.current, { scale: 2 });
    return canvas.toDataURL("image/png");
  }

  useEffect(() => {
    if (onExportReady) onExportReady(exportImage);
  }, []);

  // ===== העלאת תמונה =====
  function uploadImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const id = createId();

      setImages((prev) => [
        ...prev,
        {
          id,
          src: reader.result,
          x: 180,
          y: 320,
          scale: 1,
          filter: "normal"
        }
      ]);

      setSelectedId(id);
      setSelectedType("image");
    };

    reader.readAsDataURL(file);
  }

  // ===== הוספת טקסט =====
  function addText() {
    const id = createId();

    setTexts((prev) => [
      ...prev,
      {
        id,
        content: "טקסט חדש",
        x: 180,
        y: 120,
        scale: 1,
        color: "#fff",
        bgColor: "#000",
        align: "center",
        font: "Arial"
      }
    ]);

    setSelectedId(id);
    setSelectedType("text");
  }

  // ===== עדכון טקסט =====
  function updateText(key, value) {
    setTexts((prev) =>
      prev.map((t) =>
        t.id === selectedId ? { ...t, [key]: value } : t
      )
    );
  }

  // ===== פילטרים =====
  function applyFilter(name) {
    if (selectedType !== "image") return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === selectedId ? { ...img, filter: name } : img
      )
    );
  }

  // ===== AI =====
  function applyAIFilter(text) {
    if (selectedType !== "image") return;

    const lower = text.toLowerCase();

    let filter = "beauty";

    if (lower.includes("love")) filter = "warm";
    else if (lower.includes("money")) filter = "neon";
    else if (lower.includes("funny")) filter = "cartoon";
    else if (lower.includes("sad")) filter = "bw";
    else if (lower.includes("story")) filter = "vintage";

    applyFilter(filter);
  }

  // ===== גרירה =====
  function move(e, id, type) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (type === "text") {
      setTexts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, x, y } : t))
      );
    }

    if (type === "image") {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, x, y } : img
        )
      );
    }
  }

  return (
    <div>
      <h3>Story Editor</h3>

      <input type="file" onChange={uploadImage} />

      <button onClick={addText}>הוסף טקסט</button>

      {/* 🎯 פאנל טקסט */}
      {selectedType === "text" && selectedText && (
        <div style={{ marginTop: 10 }}>
          <input
            value={selectedText.content}
            onChange={(e) => updateText("content", e.target.value)}
          />

          <input
            type="color"
            value={selectedText.color}
            onChange={(e) => updateText("color", e.target.value)}
          />

          <input
            type="color"
            value={selectedText.bgColor}
            onChange={(e) => updateText("bgColor", e.target.value)}
          />

          <select
            value={selectedText.align}
            onChange={(e) => updateText("align", e.target.value)}
          >
            <option value="left">שמאל</option>
            <option value="center">מרכז</option>
            <option value="right">ימין</option>
          </select>

          <select
            value={selectedText.font}
            onChange={(e) => updateText("font", e.target.value)}
          >
            {FONTS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      )}

      {/* 🎨 פילטרים */}
      {selectedType === "image" && (
        <div>
          {Object.keys(FILTERS).map((f) => (
            <button key={f} onClick={() => applyFilter(f)}>
              {f}
            </button>
          ))}

          <button onClick={() => applyAIFilter(texts.map(t => t.content).join(" "))}>
            🤖 AI
          </button>
        </div>
      )}

      {/* 🎬 קנבס */}
      <div
        ref={canvasRef}
        style={{
          width: 360,
          height: 640,
          background: "#111",
          position: "relative",
          marginTop: 20
        }}
      >
        {images.map((img) => (
          <img
            key={img.id}
            src={img.src}
            onMouseDown={(e) => move(e, img.id, "image")}
            style={{
              position: "absolute",
              left: img.x,
              top: img.y,
              transform: "translate(-50%,-50%)",
              width: 200,
              filter: FILTERS[img.filter]
            }}
          />
        ))}

        {texts.map((t) => (
          <div
            key={t.id}
            onMouseDown={(e) => move(e, t.id, "text")}
            style={{
              position: "absolute",
              left: t.x,
              top: t.y,
              transform: "translate(-50%,-50%)",
              color: t.color,
              background: t.bgColor,
              padding: 10,
              fontFamily: t.font,
              textAlign: t.align
            }}
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
