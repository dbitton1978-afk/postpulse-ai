import React, { useMemo, useRef, useState, useEffect } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Group, Rect, Transformer, Label, Tag } from "react-konva";

function useImage(src) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => setImage(img);

    return () => {
      img.onload = null;
    };
  }, [src]);

  return image;
}

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

export default function StoryEditor() {
  const [backgroundSrc, setBackgroundSrc] = useState(null);
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const bgImage = useImage(backgroundSrc);
  const transformerRef = useRef(null);
  const shapeRefs = useRef({});

  useEffect(() => {
    if (!selectedId || !transformerRef.current || !shapeRefs.current[selectedId]) return;
    transformerRef.current.nodes([shapeRefs.current[selectedId]]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, layers]);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedId) || null,
    [layers, selectedId]
  );

  function updateLayer(id, patch) {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer))
    );
  }

  function deleteSelected() {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((layer) => layer.id !== selectedId));
    setSelectedId(null);
  }

  function addTextLayer() {
    const id = createId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        kind: "text",
        x: 80,
        y: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        text: "טקסט חדש",
        fontSize: 28,
        fill: "#ffffff",
        fontStyle: "bold",
      },
    ]);
    setSelectedId(id);
  }

  function addEmojiLayer() {
    const id = createId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        kind: "emoji",
        x: 120,
        y: 160,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        text: "🔥",
        fontSize: 48,
      },
    ]);
    setSelectedId(id);
  }

  function addCtaLayer() {
    const id = createId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        kind: "cta",
        x: 90,
        y: 520,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        text: "לחץ כאן",
        width: 180,
        height: 44,
      },
    ]);
    setSelectedId(id);
  }

  function onBackgroundUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundSrc(reader.result);
      setSelectedId(null);
    };
    reader.readAsDataURL(file);
  }

  function moveSelectedForward() {
    if (!selectedId) return;
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === selectedId);
      if (index === -1 || index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function moveSelectedBackward() {
    if (!selectedId) return;
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === selectedId);
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
      return next;
    });
  }

  function duplicateSelected() {
    if (!selectedLayer) return;
    const copy = {
      ...selectedLayer,
      id: createId(),
      x: selectedLayer.x + 20,
      y: selectedLayer.y + 20,
    };
    setLayers((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }

  function renderLayerNode(layer) {
    if (layer.kind === "text" || layer.kind === "emoji") {
      return (
        <Text
          ref={(node) => {
            if (node) shapeRefs.current[layer.id] = node;
          }}
          x={layer.x}
          y={layer.y}
          text={layer.text}
          fontSize={layer.fontSize}
          fill={layer.fill || "#ffffff"}
          fontStyle={layer.fontStyle || "normal"}
          draggable
          rotation={layer.rotation}
          scaleX={layer.scaleX}
          scaleY={layer.scaleY}
          onClick={() => setSelectedId(layer.id)}
          onTap={() => setSelectedId(layer.id)}
          onDragEnd={(e) => {
            updateLayer(layer.id, {
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={(e) => {
            const node = e.target;
            updateLayer(layer.id, {
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
            });
          }}
        />
      );
    }

    if (layer.kind === "cta") {
      return (
        <Group
          ref={(node) => {
            if (node) shapeRefs.current[layer.id] = node;
          }}
          x={layer.x}
          y={layer.y}
          rotation={layer.rotation}
          scaleX={layer.scaleX}
          scaleY={layer.scaleY}
          draggable
          onClick={() => setSelectedId(layer.id)}
          onTap={() => setSelectedId(layer.id)}
          onDragEnd={(e) => {
            updateLayer(layer.id, {
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={(e) => {
            const node = e.target;
            updateLayer(layer.id, {
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
            });
          }}
        >
          <Rect
            width={layer.width}
            height={layer.height}
            cornerRadius={22}
            fill="#ffffff"
            opacity={0.95}
            shadowBlur={8}
          />
          <Text
            text={layer.text}
            width={layer.width}
            height={layer.height}
            align="center"
            verticalAlign="middle"
            fontSize={18}
            fill="#111111"
            fontStyle="bold"
            padding={11}
          />
        </Group>
      );
    }

    return null;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.leftPanel}>
        <div style={styles.section}>
          <div style={styles.title}>עורך סטורי</div>
          <div style={styles.subTitle}>גרסה ראשונה בטוחה ל-PostPulse</div>
        </div>

        <div style={styles.section}>
          <label style={styles.uploadLabel}>
            העלה תמונת רקע
            <input type="file" accept="image/*" onChange={onBackgroundUpload} style={{ display: "none" }} />
          </label>
        </div>

        <div style={styles.section}>
          <button style={styles.button} onClick={addTextLayer}>הוסף טקסט</button>
          <button style={styles.button} onClick={addEmojiLayer}>הוסף אימוג׳י</button>
          <button style={styles.button} onClick={addCtaLayer}>הוסף CTA</button>
        </div>

        <div style={styles.section}>
          <button style={styles.smallButton} onClick={duplicateSelected} disabled={!selectedLayer}>שכפל</button>
          <button style={styles.smallButton} onClick={moveSelectedForward} disabled={!selectedLayer}>קדימה</button>
          <button style={styles.smallButton} onClick={moveSelectedBackward} disabled={!selectedLayer}>אחורה</button>
          <button style={styles.deleteButton} onClick={deleteSelected} disabled={!selectedLayer}>מחק</button>
        </div>

        {selectedLayer && (
          <div style={styles.section}>
            <div style={styles.panelTitle}>עריכת אלמנט</div>

            {(selectedLayer.kind === "text" || selectedLayer.kind === "emoji" || selectedLayer.kind === "cta") && (
              <>
                <label style={styles.fieldLabel}>טקסט</label>
                <input
                  style={styles.input}
                  value={selectedLayer.text}
                  onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                />
              </>
            )}

            {(selectedLayer.kind === "text" || selectedLayer.kind === "emoji") && (
              <>
                <label style={styles.fieldLabel}>גודל פונט</label>
                <input
                  style={styles.input}
                  type="number"
                  min="12"
                  max="120"
                  value={selectedLayer.fontSize}
                  onChange={(e) =>
                    updateLayer(selectedLayer.id, { fontSize: Number(e.target.value) || 28 })
                  }
                />
              </>
            )}

            {selectedLayer.kind === "text" && (
              <>
                <label style={styles.fieldLabel}>צבע טקסט</label>
                <input
                  style={styles.colorInput}
                  type="color"
                  value={selectedLayer.fill || "#ffffff"}
                  onChange={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })}
                />
              </>
            )}
          </div>
        )}
      </div>

      <div style={styles.canvasWrap}>
        <div style={styles.canvasFrame}>
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) {
                setSelectedId(null);
              }
            }}
            onTouchStart={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
              <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#1f1f1f" />
              {bgImage ? (
                <KonvaImage
                  image={bgImage}
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                />
              ) : (
                <Label x={40} y={300}>
                  <Tag fill="#2a2a2a" cornerRadius={10} />
                  <Text
                    text="העלה תמונה כדי להתחיל"
                    padding={14}
                    fill="#ffffff"
                    fontSize={20}
                    fontStyle="bold"
                  />
                </Label>
              )}
            </Layer>

            <Layer>
              {layers.map((layer) => (
                <React.Fragment key={layer.id}>
                  {renderLayerNode(layer)}
                </React.Fragment>
              ))}

              <Transformer
                ref={transformerRef}
                rotateEnabled
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 30 || newBox.height < 30) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    alignItems: "flex-start",
    width: "100%",
  },
  leftPanel: {
    width: "320px",
    background: "#111111",
    color: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    boxSizing: "border-box",
  },
  section: {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
  },
  subTitle: {
    fontSize: "14px",
    opacity: 0.75,
  },
  panelTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  uploadLabel: {
    background: "#ffffff",
    color: "#111111",
    padding: "12px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "center",
    fontWeight: "700",
  },
  button: {
    background: "#2a2a2a",
    color: "#ffffff",
    border: "none",
    padding: "12px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  smallButton: {
    background: "#2a2a2a",
    color: "#ffffff",
    border: "none",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  deleteButton: {
    background: "#a92b2b",
    color: "#ffffff",
    border: "none",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: "13px",
    opacity: 0.85,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #333333",
    background: "#1b1b1b",
    color: "#ffffff",
    boxSizing: "border-box",
  },
  colorInput: {
    width: "100%",
    height: "42px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  canvasWrap: {
    flex: 1,
    minWidth: "380px",
    display: "flex",
    justifyContent: "center",
  },
  canvasFrame: {
    background: "#0c0c0c",
    padding: "14px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
};
