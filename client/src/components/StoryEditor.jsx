import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const EMOJIS = ["🔥","❤️","😂","😍","🚀","💡","🎯","✨","👑","⚡"];

export default function StoryEditor({
  incomingText,
  incomingTextToken,
  onExportReady
}) {
  const [texts, setTexts] = useState([]);
  const [emojis, setEmojis] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  const canvasRef = useRef();

  // הכנסת טקסט מהאפליקציה
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

  // export function
  async function exportImage() {
    if (!canvasRef.current) return null;

    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: null,
      scale: 2
    });

    return canvas.toDataURL("image/png");
  }

  // שולח ל-App
  useEffect(() => {
    if (onExportReady) {
      onExportReady(exportImage);
    }
  }, []);

  // ===== אימוג׳י =====
  function addEmoji(emoji) {
    const id = createId();

    setEmojis((prev) => [
      ...prev,
      {
        id,
        content: emoji,
        x: 180,
        y: 200,
        scale: 1.5
      }
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

    if (dragItem.type === "emoji") {
      setEmojis((prev) =>
        prev.map((i) => (i.id === dragItem.id ? { ...i, x, y } : i))
      );
    }

    if (dragItem.type === "text") {
      setTexts((prev) =>
        prev.map((i) => (i.id === dragItem.id ? { ...i, x, y } : i))
      );
    }
  }

  function scaleSelected(delta) {
    if (!selectedId) return;

    const update = (item) => ({
      ...item,
      scale: Math.min(3, Math.max(0.3, item.scale + delta))
    });

    if (selectedType === "emoji") {
      setEmojis((prev) =>
        prev.map((i) => (i.id === selectedId ? update(i) : i))
      );
    }

    if (selectedType === "text") {
      setTexts((prev) =>
        prev.map((i) => (i.id === selectedId ? update(i) : i))
      );
    }
  }

  function removeSelected() {
    if (!selectedId) return;

    if (selectedType === "emoji") {
      setEmojis((prev) => prev.filter((i) => i.id !== selectedId));
    }

    if (selectedType === "text") {
      setTexts((prev) => prev.filter((i) => i.id !== selectedId));
    }

    setSelectedId(null);
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Story Editor</h3>

      {/* אימוג׳ים */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => addEmoji(e)}>
            {e}
          </button>
        ))}

        <button onClick={() => scaleSelected(0.1)}>+</button>
        <button onClick={() => scaleSelected(-0.1)}>-</button>
        <button onClick={removeSelected}>🗑</button>
      </div>

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
              borderRadius: 10,
              cursor: "grab"
            }}
          >
            {t.content}
          </div>
        ))}

        {emojis.map((e) => (
          <div
            key={e.id}
            onMouseDown={() => handleMouseDown(e.id, "emoji")}
            style={{
              position: "absolute",
              left: e.x,
              top: e.y,
              transform: `translate(-50%,-50%) scale(${e.scale})`,
              fontSize: 40,
              cursor: "grab"
            }}
          >
            {e.content}
          </div>
        ))}
      </div>
    </div>
  );
}
