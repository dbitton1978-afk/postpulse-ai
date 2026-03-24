import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const FILTERS = {
  normal: "none",
  smooth: "blur(1px) brightness(1.08)",
  beauty: "brightness(1.18) contrast(1.08) saturate(1.15)",
  bw: "grayscale(1)",
  vintage: "sepia(0.65) contrast(1.1) brightness(0.95)",
  cartoon: "contrast(1.8) saturate(1.8)",
  mosaic: "blur(4px)",
  neon: "brightness(1.25) saturate(2)",
  dark: "brightness(0.65)",
  warm: "sepia(0.3) saturate(1.35)"
};

const EMOJIS = ["🔥", "❤️", "😂", "😍", "🚀", "💡", "🎯", "✨", "👑", "⚡"];

const DEFAULT_TEXT_STYLE = {
  color: "#ffffff",
  bgColor: "rgba(0,0,0,0.4)",
  padding: 10,
  borderRadius: 10
};

export default function StoryEditor({
  incomingText = "",
  incomingTextToken = 0,
  onExportReady
}) {
  const [texts, setTexts] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [images, setImages] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  const canvasRef = useRef(null);

  const allText = useMemo(
    () => texts.map((t) => t.content).join(" ").trim(),
    [texts]
  );

  useEffect(() => {
    if (!incomingText || !incomingTextToken) return;

    const id = createId();

    setTexts((prev) => [
      ...prev,
      {
        id,
        content: incomingText,
        x: 180,
        y: 320,
        scale: incomingText.length < 60 ? 1.2 : 1,
        ...DEFAULT_TEXT_STYLE
      }
    ]);

    setSelectedId(id);
    setSelectedType("text");
  }, [incomingText, incomingTextToken]);

  async function exportImage() {
    if (!canvasRef.current) return null;

    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });

    return canvas.toDataURL("image/png");
  }

  useEffect(() => {
    if (onExportReady) {
      onExportReady(() => exportImage);
    }
  }, [onExportReady]);

  function handleUpload(e) {
    const file = e.target.files?.[0];
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
    e.target.value = "";
  }

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
        ...DEFAULT_TEXT_STYLE
      }
    ]);

    setSelectedId(id);
    setSelectedType("text");
  }

  function applyFilter(filterName) {
    if (selectedType !== "image") return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === selectedId ? { ...img, filter: filterName } : img
      )
    );
  }

  function applyAIFilter(text) {
    if (!text || selectedType !== "image") return;

    const lower = text.toLowerCase();

    let filter = "normal";
    let emoji = "✨";

    if (
      lower.includes("כסף") ||
      lower.includes("money") ||
      lower.includes("sale") ||
      lower.includes("מבצע") ||
      lower.includes("הנחה")
    ) {
      filter = "neon";
      emoji = "💰";
    } else if (
      lower.includes("אהבה") ||
      lower.includes("love") ||
      lower.includes("heart") ||
      lower.includes("רגש")
    ) {
      filter = "warm";
      emoji = "❤️";
    } else if (
      lower.includes("מצחיק") ||
      lower.includes("funny") ||
      lower.includes("laugh")
    ) {
      filter = "cartoon";
      emoji = "😂";
    } else if (
      lower.includes("סיפור") ||
      lower.includes("story") ||
      lower.includes("nostalgia")
    ) {
      filter = "vintage";
      emoji = "✨";
    } else if (
      lower.includes("עצוב") ||
      lower.includes("sad") ||
      lower.includes("pain")
    ) {
      filter = "bw";
      emoji = "💔";
    } else if (
      lower.includes("יופי") ||
      lower.includes("beauty") ||
      lower.includes("פנים") ||
      lower.includes("face")
    ) {
      filter = "beauty";
      emoji = "😍";
    } else if (
      lower.includes("טיפ") ||
      lower.includes("tip") ||
      lower.includes("guide") ||
      lower.includes("ללמוד")
    ) {
      filter = "smooth";
      emoji = "💡";
    } else {
      filter = "beauty";
      emoji = "🔥";
    }

    setImages((prev) =>
      prev.map((img) =>
        img.id === selectedId ? { ...img, filter } : img
      )
    );

    addEmoji(emoji);
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

    if (dragItem.type === "emoji") {
      setEmojis((prev) =>
        prev.map((item) =>
          item.id === dragItem.id ? { ...item, x, y } : item
        )
      );
    }
  }

  function scaleSelected(delta) {
    if (!selectedId || !selectedType) return;

    const updateScale = (item) => ({
      ...item,
      scale: Math.min(3, Math.max(0.3, (item.scale || 1) + delta))
    });

    if (selectedType === "image") {
      setImages((prev) =>
        prev.map((item) =>
          item.id === selectedId ? updateScale(item) : item
        )
      );
    }

    if (selectedType === "text") {
      setTexts((prev) =>
        prev.map((item) =>
          item.id === selectedId ? updateScale(item) : item
        )
      );
    }

    if (selectedType === "emoji") {
      setEmojis((prev) =>
        prev.map((item) =>
          item.id === selectedId ? updateScale(item) : item
        )
      );
    }
  }

  function removeSelected() {
    if (!selectedId) return;

    if (selectedType === "image") {
      setImages((prev) => prev.filter((item) => item.id !== selectedId));
    }

    if (selectedType === "text") {
      setTexts((prev) => prev.filter((item) => item.id !== selectedId));
    }

    if (selectedType === "emoji") {
      setEmojis((prev) => prev.filter((item) => item.id !== selectedId));
    }

    setSelectedId(null);
    setSelectedType(null);
    setDragItem(null);
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Story Editor</h3>

      <input type="file" accept="image/*" onChange={handleUpload} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <button onClick={addText}>הוסף טקסט</button>

        {EMOJIS.map((emoji) => (
          <button key={emoji} onClick={() => addEmoji(emoji)}>
            {emoji}
          </button>
        ))}

        <button onClick={() => scaleSelected(0.1)} disabled={!selectedId}>
          +
        </button>
        <button onClick={() => scaleSelected(-0.1)} disabled={!selectedId}>
          -
        </button>
        <button onClick={removeSelected} disabled={!selectedId}>
          🗑
        </button>
      </div>

      {selectedType === "image" && (
        <>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(FILTERS).map((filterName) => (
              <button key={filterName} onClick={() => applyFilter(filterName)}>
                {filterName}
              </button>
            ))}
          </div>

          <button
            style={{ marginTop: 10, background: "#00ffcc", color: "#111" }}
            onClick={() => applyAIFilter(allText)}
          >
            🤖 AI פילטר אוטומטי
          </button>
        </>
      )}

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
          borderRadius: 20,
          overflow: "hidden"
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
              transform: `translate(-50%, -50%) scale(${img.scale})`,
              filter: FILTERS[img.filter] || FILTERS.normal,
              cursor: "grab",
              border:
                selectedId === img.id && selectedType === "image"
                  ? "2px solid #00ffcc"
                  : "none"
            }}
          />
        ))}

        {texts.map((text) => (
          <div
            key={text.id}
            onMouseDown={() => handleMouseDown(text.id, "text")}
            style={{
              position: "absolute",
              left: text.x,
              top: text.y,
              transform: `translate(-50%, -50%) scale(${text.scale})`,
              color: text.color,
              background: text.bgColor,
              padding: text.padding,
              borderRadius: text.borderRadius,
              cursor: "grab",
              border:
                selectedId === text.id && selectedType === "text"
                  ? "2px solid #00ffcc"
                  : "none"
            }}
          >
            {text.content}
          </div>
        ))}

        {emojis.map((emoji) => (
          <div
            key={emoji.id}
            onMouseDown={() => handleMouseDown(emoji.id, "emoji")}
            style={{
              position: "absolute",
              left: emoji.x,
              top: emoji.y,
              transform: `translate(-50%, -50%) scale(${emoji.scale})`,
              fontSize: 40,
              cursor: "grab",
              border:
                selectedId === emoji.id && selectedType === "emoji"
                  ? "2px solid #00ffcc"
                  : "none",
              borderRadius: 8
            }}
          >
            {emoji.content}
          </div>
        ))}
      </div>
    </div>
  );
}
