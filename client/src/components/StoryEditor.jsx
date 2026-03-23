import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function splitTextToSlides(text) {
  if (!text || !text.trim()) return [];

  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);

  if (sentences.length <= 1) {
    if (clean.length <= 120) return [clean];
    const parts = [];
    let current = "";
    const words = clean.split(" ");

    for (const word of words) {
      if ((current + " " + word).trim().length <= 110) {
        current = `${current} ${word}`.trim();
      } else {
        if (current) parts.push(current);
        current = word;
      }
    }
    if (current) parts.push(current);
    return parts.slice(0, 4);
  }

  const slides = [];
  let current = "";

  for (const sentence of sentences) {
    const next = `${current} ${sentence}`.trim();
    if (next.length <= 110) {
      current = next;
    } else {
      if (current) slides.push(current);
      current = sentence;
    }
  }

  if (current) slides.push(current);

  return slides.slice(0, 4);
}

function detectPostType(text) {
  const t = (text || "").toLowerCase();

  if (
    t.includes("sale") ||
    t.includes("discount") ||
    t.includes("offer") ||
    t.includes("מבצע") ||
    t.includes("הנחה") ||
    t.includes("לקנות")
  ) {
    return "sales";
  }

  if (
    t.includes("tip") ||
    t.includes("guide") ||
    t.includes("how") ||
    t.includes("learn") ||
    t.includes("tips") ||
    t.includes("מדריך") ||
    t.includes("טיפ") ||
    t.includes("ללמוד")
  ) {
    return "educational";
  }

  if (
    t.includes("love") ||
    t.includes("heart") ||
    t.includes("emotion") ||
    t.includes("authentic") ||
    t.includes("רגש") ||
    t.includes("אהבה") ||
    t.includes("מהלב")
  ) {
    return "emotional";
  }

  if (
    t.includes("event") ||
    t.includes("launch") ||
    t.includes("now") ||
    t.includes("today") ||
    t.includes("join") ||
    t.includes("אירוע") ||
    t.includes("השקה") ||
    t.includes("היום")
  ) {
    return "event";
  }

  return "general";
}

function getThemeByType(type) {
  const themes = {
    sales: {
      name: "Sales",
      background: "linear-gradient(135deg, #0f172a 0%, #7f1d1d 45%, #f97316 100%)",
      textColor: "#ffffff",
      accentColor: "#facc15",
      boxColor: "rgba(0,0,0,0.30)"
    },
    educational: {
      name: "Educational",
      background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%)",
      textColor: "#ffffff",
      accentColor: "#a7f3d0",
      boxColor: "rgba(0,0,0,0.24)"
    },
    emotional: {
      name: "Emotional",
      background: "linear-gradient(135deg, #4c1d95 0%, #be185d 55%, #fb7185 100%)",
      textColor: "#ffffff",
      accentColor: "#fde68a",
      boxColor: "rgba(255,255,255,0.12)"
    },
    event: {
      name: "Event",
      background: "linear-gradient(135deg, #111827 0%, #065f46 50%, #10b981 100%)",
      textColor: "#ffffff",
      accentColor: "#fef08a",
      boxColor: "rgba(0,0,0,0.28)"
    },
    general: {
      name: "General",
      background: "linear-gradient(135deg, #111827 0%, #312e81 50%, #7c3aed 100%)",
      textColor: "#ffffff",
      accentColor: "#93c5fd",
      boxColor: "rgba(0,0,0,0.30)"
    }
  };

  return themes[type] || themes.general;
}

function getSlidePreset(index, textLength) {
  if (index === 0) {
    return {
      x: 180,
      y: textLength < 60 ? 290 : 320,
      scale: textLength < 60 ? 1.45 : 1.2,
      maxWidth: textLength < 60 ? 290 : 270,
      fontSize: textLength < 60 ? 34 : 28
    };
  }

  if (index === 1) {
    return {
      x: 180,
      y: 320,
      scale: 1,
      maxWidth: 280,
      fontSize: 24
    };
  }

  return {
    x: 180,
    y: 510,
    scale: 1.05,
    maxWidth: 280,
    fontSize: 26
  };
}

function buildAutoSlides(text) {
  const parts = splitTextToSlides(text);
  const type = detectPostType(text);
  const theme = getThemeByType(type);

  if (!parts.length) {
    return [
      {
        id: createId(),
        theme,
        transition: "fade",
        layers: []
      }
    ];
  }

  return parts.map((part, index) => {
    const preset = getSlidePreset(index, part.length);

    const layers = [
      {
        id: createId(),
        type: "text",
        x: preset.x,
        y: preset.y,
        scale: preset.scale,
        maxWidth: preset.maxWidth,
        fontSize: preset.fontSize,
        fontFamily: "Arial",
        align: "center",
        color: theme.textColor,
        bgColor: theme.boxColor,
        borderRadius: 16,
        paddingX: 16,
        paddingY: 12,
        content: part
      }
    ];

    if (index === 0) {
      layers.push({
        id: createId(),
        type: "emoji",
        x: 180,
        y: 120,
        scale: 1.2,
        fontSize: 34,
        content:
          type === "sales"
            ? "🔥"
            : type === "educational"
            ? "💡"
            : type === "emotional"
            ? "❤️"
            : type === "event"
            ? "🚀"
            : "✨"
      });
    }

    if (index === parts.length - 1 && parts.length > 1) {
      layers.push({
        id: createId(),
        type: "emoji",
        x: 300,
        y: 580,
        scale: 1.1,
        fontSize: 28,
        content: "👉"
      });
    }

    return {
      id: createId(),
      theme,
      transition: index % 2 === 0 ? "fade" : "slide",
      layers
    };
  });
}

export default function StoryEditor({
  incomingText = "",
  incomingTextToken = 0
}) {
  const [slides, setSlides] = useState([
    {
      id: createId(),
      theme: getThemeByType("general"),
      transition: "fade",
      layers: []
    }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const stageRef = useRef(null);

  useEffect(() => {
    if (!incomingText || !incomingTextToken) return;

    const autoSlides = buildAutoSlides(incomingText);
    setSlides(autoSlides);
    setCurrentSlide(0);
    setSelectedId(null);
    setCanvasKey((prev) => prev + 1);
  }, [incomingText, incomingTextToken]);

  useEffect(() => {
    setCanvasKey((prev) => prev + 1);
    setSelectedId(null);
  }, [currentSlide]);

  const current = slides[currentSlide] || slides[0];
  const layers = current?.layers || [];

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedId),
    [layers, selectedId]
  );

  function updateSlides(updater) {
    setSlides((prev) => updater(prev));
  }

  function updateCurrentLayers(newLayers) {
    updateSlides((prev) =>
      prev.map((slide, index) =>
        index === currentSlide ? { ...slide, layers: newLayers } : slide
      )
    );
  }

  function updateSelectedLayer(patch) {
    if (!selectedId) return;

    updateCurrentLayers(
      layers.map((layer) =>
        layer.id === selectedId ? { ...layer, ...patch } : layer
      )
    );
  }

  function handleUploadImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = () => {
        const id = `${createId()}-${index}`;

        updateCurrentLayers([
          ...layers,
          {
            id,
            type: "image",
            x: 180 + index * 12,
            y: 320 + index * 12,
            scale: 1,
            rotation: 0,
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

    updateCurrentLayers([
      ...layers,
      {
        id,
        type: "text",
        x: 180,
        y: 520,
        scale: 1,
        rotation: 0,
        maxWidth: 260,
        fontSize: 24,
        fontFamily: "Arial",
        align: "center",
        color: current.theme.textColor,
        bgColor: current.theme.boxColor,
        borderRadius: 16,
        paddingX: 16,
        paddingY: 12,
        content: "טקסט חדש"
      }
    ]);

    setSelectedId(id);
  }

  function addEmoji() {
    const id = createId();

    updateCurrentLayers([
      ...layers,
      {
        id,
        type: "emoji",
        x: 110,
        y: 130,
        scale: 1,
        rotation: 0,
        fontSize: 34,
        content: "🔥"
      }
    ]);

    setSelectedId(id);
  }

  function addAutoStory() {
    if (!incomingText || !incomingText.trim()) return;

    const autoSlides = buildAutoSlides(incomingText);
    setSlides(autoSlides);
    setCurrentSlide(0);
    setSelectedId(null);
    setCanvasKey((prev) => prev + 1);
  }

  function addSlide() {
    const theme = current?.theme || getThemeByType("general");

    setSlides((prev) => [
      ...prev,
      {
        id: createId(),
        theme,
        transition: "fade",
        layers: []
      }
    ]);
    setCurrentSlide(slides.length);
  }

  function deleteSlide() {
    if (slides.length === 1) {
      setSlides([
        {
          id: createId(),
          theme: getThemeByType("general"),
          transition: "fade",
          layers: []
        }
      ]);
      setCurrentSlide(0);
      setSelectedId(null);
      return;
    }

    const nextSlides = slides.filter((_, index) => index !== currentSlide);
    setSlides(nextSlides);
    setCurrentSlide(Math.max(0, currentSlide - 1));
    setSelectedId(null);
  }

  function clearCurrentSlide() {
    updateSlides((prev) =>
      prev.map((slide, index) =>
        index === currentSlide ? { ...slide, layers: [] } : slide
      )
    );
    setSelectedId(null);
  }

  function deleteSelectedLayer() {
    if (!selectedId) return;
    updateCurrentLayers(layers.filter((layer) => layer.id !== selectedId));
    setSelectedId(null);
  }

  function bringSelectedToFront() {
    if (!selectedId) return;

    const selected = layers.find((layer) => layer.id === selectedId);
    const others = layers.filter((layer) => layer.id !== selectedId);

    if (!selected) return;
    updateCurrentLayers([...others, selected]);
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

    updateCurrentLayers(
      layers.map((layer) =>
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

  function scaleSelected(delta) {
    if (!selectedId) return;

    updateCurrentLayers(
      layers.map((layer) =>
        layer.id === selectedId
          ? {
              ...layer,
              scale: Math.min(3, Math.max(0.35, (layer.scale || 1) + delta))
            }
          : layer
      )
    );
  }

  function rotateSelected(delta) {
    if (!selectedId) return;

    updateCurrentLayers(
      layers.map((layer) =>
        layer.id === selectedId
          ? {
              ...layer,
              rotation: (layer.rotation || 0) + delta
            }
          : layer
      )
    );
  }

  function applyTheme(type) {
    const theme = getThemeByType(type);

    updateSlides((prev) =>
      prev.map((slide, index) => {
        if (index !== currentSlide) return slide;

        return {
          ...slide,
          theme,
          layers: slide.layers.map((layer) => {
            if (layer.type !== "text") return layer;
            return {
              ...layer,
              color: layer.color || theme.textColor,
              bgColor: layer.bgColor || theme.boxColor
            };
          })
        };
      })
    );
  }

  function setTransition(transition) {
    updateSlides((prev) =>
      prev.map((slide, index) =>
        index === currentSlide ? { ...slide, transition } : slide
      )
    );
  }

  async function exportCurrentSlide() {
    if (!stageRef.current) return;

    const canvas = await html2canvas(stageRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });

    const link = document.createElement("a");
    link.download = `postpulse-story-slide-${currentSlide + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function exportAllSlides() {
    const originalIndex = currentSlide;

    for (let i = 0; i < slides.length; i += 1) {
      setCurrentSlide(i);
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (!stageRef.current) continue;

      const canvas = await html2canvas(stageRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });

      const link = document.createElement("a");
      link.download = `postpulse-story-slide-${i + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    setCurrentSlide(originalIndex);
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Designer Pro</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={addAutoStory} disabled={!incomingText}>
          AI סטורי אוטומטי
        </button>
        <input type="file" accept="image/*" multiple onChange={handleUploadImages} />
      </div>

      <div
        style={{
          marginBottom: 12,
          padding: 12,
          border: "1px solid #333",
          borderRadius: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }}
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(index)}
            style={{
              background: index === currentSlide ? "#22d3ee" : "#2a2a2a",
              color: index === currentSlide ? "#111" : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer"
            }}
          >
            {index + 1}
          </button>
        ))}

        <button onClick={addSlide}>+ שקופית</button>
        <button onClick={deleteSlide}>מחק שקופית</button>
        <button onClick={clearCurrentSlide}>נקה שקופית</button>
      </div>

      <div
        style={{
          marginBottom: 12,
          padding: 12,
          border: "1px solid #333",
          borderRadius: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }}
      >
        <button onClick={addText}>הוסף טקסט</button>
        <button onClick={addEmoji}>הוסף אימוג׳י</button>
        <button onClick={() => scaleSelected(0.1)} disabled={!selectedId}>
          הגדל +
        </button>
        <button onClick={() => scaleSelected(-0.1)} disabled={!selectedId}>
          הקטן -
        </button>
        <button onClick={() => rotateSelected(8)} disabled={!selectedId}>
          סובב +
        </button>
        <button onClick={() => rotateSelected(-8)} disabled={!selectedId}>
          סובב -
        </button>
        <button onClick={bringSelectedToFront} disabled={!selectedId}>
          הבא לקדימה
        </button>
        <button onClick={deleteSelectedLayer} disabled={!selectedId}>
          מחק נבחר
        </button>
      </div>

      <div
        style={{
          marginBottom: 12,
          padding: 12,
          border: "1px solid #333",
          borderRadius: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <span>רקע אוטומטי:</span>
        <button onClick={() => applyTheme("general")}>General</button>
        <button onClick={() => applyTheme("sales")}>Sales</button>
        <button onClick={() => applyTheme("educational")}>Educational</button>
        <button onClick={() => applyTheme("emotional")}>Emotional</button>
        <button onClick={() => applyTheme("event")}>Event</button>
      </div>

      <div
        style={{
          marginBottom: 12,
          padding: 12,
          border: "1px solid #333",
          borderRadius: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <span>מעבר:</span>
        <button onClick={() => setTransition("fade")}>Fade</button>
        <button onClick={() => setTransition("slide")}>Slide</button>
        <button onClick={() => setTransition("zoom")}>Zoom</button>

        <span style={{ marginInlineStart: 16 }}>Export:</span>
        <button onClick={exportCurrentSlide}>ייצא שקופית</button>
        <button onClick={exportAllSlides}>ייצא הכל</button>
      </div>

      {selectedLayer && selectedLayer.type === "text" && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            border: "1px solid #333",
            borderRadius: 12,
            display: "grid",
            gap: 8
          }}
        >
          <input
            value={selectedLayer.content}
            onChange={(e) => updateSelectedLayer({ content: e.target.value })}
            style={{ padding: 10 }}
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label>
              צבע טקסט{" "}
              <input
                type="color"
                value={selectedLayer.color || "#ffffff"}
                onChange={(e) => updateSelectedLayer({ color: e.target.value })}
              />
            </label>

            <label>
              רקע{" "}
              <input
                type="color"
                value="#000000"
                onChange={(e) =>
                  updateSelectedLayer({ bgColor: `${e.target.value}aa` })
                }
              />
            </label>

            <select
              value={selectedLayer.align || "center"}
              onChange={(e) => updateSelectedLayer({ align: e.target.value })}
            >
              <option value="left">שמאל</option>
              <option value="center">מרכז</option>
              <option value="right">ימין</option>
            </select>

            <select
              value={selectedLayer.fontFamily || "Arial"}
              onChange={(e) =>
                updateSelectedLayer({ fontFamily: e.target.value })
              }
            >
              <option value="Arial">Arial</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Georgia">Georgia</option>
              <option value="Impact">Impact</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
        </div>
      )}

      <div
        key={canvasKey}
        style={{
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div
          ref={stageRef}
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
            overflow: "hidden",
            borderRadius: 24,
            border: `3px solid ${current.theme.accentColor}`,
            background: current.theme.background,
            boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
            transition: "all 0.45s ease",
            animation:
              current.transition === "fade"
                ? "ppFadeIn 0.45s ease"
                : current.transition === "slide"
                ? "ppSlideIn 0.45s ease"
                : "ppZoomIn 0.45s ease"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 30%), radial-gradient(circle at bottom left, rgba(255,255,255,0.10), transparent 30%)"
            }}
          />

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
                    transform: `translate(-50%, -50%) scale(${layer.scale || 1}) rotate(${layer.rotation || 0}deg)`,
                    transformOrigin: "center center",
                    border: selectedId === layer.id ? "3px solid #22d3ee" : "none",
                    borderRadius: 18,
                    cursor: "grab",
                    userSelect: "none",
                    zIndex: selectedId === layer.id ? 10 : 1,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.22)"
                  }}
                />
              );
            }

            if (layer.type === "emoji") {
              return (
                <div
                  key={layer.id}
                  onMouseDown={() => handleMouseDown(layer.id)}
                  style={{
                    position: "absolute",
                    left: layer.x,
                    top: layer.y,
                    transform: `translate(-50%, -50%) scale(${layer.scale || 1}) rotate(${layer.rotation || 0}deg)`,
                    transformOrigin: "center center",
                    fontSize: layer.fontSize || 32,
                    lineHeight: 1,
                    cursor: "grab",
                    userSelect: "none",
                    zIndex: selectedId === layer.id ? 10 : 3,
                    border: selectedId === layer.id ? "2px solid #22d3ee" : "none",
                    borderRadius: 10,
                    padding: 4
                  }}
                >
                  {layer.content}
                </div>
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
                  transform: `translate(-50%, -50%) scale(${layer.scale || 1}) rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                  color: layer.color || "#ffffff",
                  background: layer.bgColor || "rgba(0,0,0,0.30)",
                  padding: `${layer.paddingY || 12}px ${layer.paddingX || 16}px`,
                  borderRadius: layer.borderRadius || 16,
                  textAlign: layer.align || "center",
                  fontFamily: layer.fontFamily || "Arial",
                  fontSize: layer.fontSize || 24,
                  lineHeight: 1.35,
                  maxWidth: layer.maxWidth || 260,
                  cursor: "grab",
                  userSelect: "none",
                  zIndex: selectedId === layer.id ? 10 : 2,
                  border: selectedId === layer.id ? "2px solid #22d3ee" : "none",
                  whiteSpace: "pre-wrap",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
                }}
              >
                {layer.content}
              </div>
            );
          })}
        </div>
      </div>

      <style>
        {`
          @keyframes ppFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes ppSlideIn {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes ppZoomIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}
