import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// 🎨 10 פילטרים
const FILTERS = {
  normal: "none",
  smooth: "blur(1px) brightness(1.1)",
  beauty: "brightness(1.2) contrast(1.1) saturate(1.2)",
  bw: "grayscale(1)",
  vintage: "sepia(0.6) contrast(1.2) brightness(0.9)",
  cartoon: "contrast(2) saturate(2)",
  mosaic: "blur(4px)",
  neon: "brightness(1.3) saturate(2)",
  dark: "brightness(0.6)",
  warm: "sepia(0.3) saturate(1.5)"
};

const EMOJIS = ["🔥","❤️","😂","😍","🚀","💡","🎯","✨","👑","⚡"];

export default function StoryEditor({
  incomingText,
  incomingTextToken,
  onExportReady
}) {
  const [texts, setTexts] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [images, setImages] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  const canvasRef = useRef();

  // ===== טקסט נכנס =====
  useEffect(() => {
    if (!incomingText) return;

    const id = createId();

    setTexts((prev) => [
      ...prev,
      {
        id,
        content: incomingText,
        x: 180,
        y: 320,
        scale: 1
      }
    ]);

    setSelectedId(id);
    setSelectedType("text");
  }, [incomingTextToken]);

  // ===== העלאת תמונה =====
  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImages((prev) => [
        ...prev,
        {
          id: createId(),
          src: reader.result,
          x: 180,
          y: 320,
          scale: 1,
          filter: "normal"
        }
      ]);
    };
    reader.readAsDataURL(file);
  }

  // ===== פילטר =====
  function applyFilter(filterName) {
    if (selectedType !== "image") return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === selectedId ? { ...img, filter: filterName } : img
      )
    );
  }

  // ===== אימוג׳י =====
  function addEmoji(e) {
    const id = createId();

    setEmojis((prev) => [
      ...prev,
      { id, content: e, x: 180, y: 200, scale: 1.5 }
    ]);

    setSelectedId(id);
    setSelectedType("emoji");
  }

  // ===== גרירה =====
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

    const move = (arr, set) =>
      set(arr.map((i) => (i.id === dragItem.id ? { ...i, x, y } : i)));

    if (dragItem.type === "image") move(images, setImages);
    if (dragItem.type === "text") move(texts, setTexts);
    if (dragItem.type === "emoji") move(emojis, setEmojis);
  }

  // ===== scale =====
  function scaleSelected(delta) {
    const update = (arr, set) =>
      set(
        arr.map((i) =>
          i.id === selectedId
            ? { ...i, scale: Math.max(0.3, Math.min(3, i.scale + delta)) }
            : i
        )
      );

    if (selectedType === "image") update(images, setImages);
    if (selectedType === "text") update(texts, setTexts);
    if (selectedType === "emoji") update(emojis, setEmojis);
  }

  // ===== export =====
  async function exportImage() {
    const canvas = await html2canvas(canvasRef.current, { scale: 2 });
    return canvas.toDataURL("image/png");
  }

  useEffect(() => {
    if (onExportReady) onExportReady(exportImage);
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Story Editor</h3>

      <input type="file" accept="image/*" onChange={handleUpload} />

      {/* אימוג׳ים */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => addEmoji(e)}>{e}</button>
        ))}

        <button onClick={() => scaleSelected(0.1)}>+</button>
        <button onClick={() => scaleSelected(-0.1)}>-</button>
      </div>

      {/* 🎨 פילטרים */}
      {selectedType === "image" && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.keys(FILTERS).map((f) => (
            <button key={f} onClick={() => applyFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* קנבס */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          marginTop: 20,
          width: 360,
          height: 640,
          background: "#111",
          position: "relative",
          borderRadius: 20
        }}
      >
        {/* תמונות */}
        {images.map((img) => (
          <img
            key={img.id}
            src={img.src}
            onMouseDown={() => handleMouseDown(img.id, "image")}
            style={{
              position: "absolute",
              left: img.x,
              top: img.y,
              width: 200,
              transform: `translate(-50%,-50%) scale(${img.scale})`,
              filter: FILTERS[img.filter],
              cursor: "grab"
            }}
          />
        ))}

        {/* טקסט */}
        {texts.map((t) => (
          <div
            key={t.id}
            onMouseDown={() => handleMouseDown(t.id, "text")}
            style={{
              position: "absolute",
              left: t.x,
              top: t.y,
              transform: `translate(-50%,-50%) scale(${t.scale})`,
              color: "#fff",
              background: "rgba(0,0,0,0.4)",
              padding: 10,
              borderRadius: 10
            }}
          >
            {t.content}
          </div>
        ))}

        {/* אימוג׳ים */}
        {emojis.map((e) => (
          <div
            key={e.id}
            onMouseDown={() => handleMouseDown(e.id, "emoji")}
            style={{
              position: "absolute",
              left: e.x,
              top: e.y,
              transform: `translate(-50%,-50%) scale(${e.scale})`,
              fontSize: 40
            }}
          >
            {e.content}
          </div>
        ))}
      </div>
    </div>
  );
}
