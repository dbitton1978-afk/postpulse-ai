import { useState } from "react";

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export default function StoryEditor() {
  const [images, setImages] = useState([]);

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
            src: reader.result
          }
        ]);
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Story Editor - Step 1</h2>

      {/* העלאת תמונה */}
      <input type="file" accept="image/*" multiple onChange={handleUpload} />

      {/* קנבס */}
      <div
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
          <div key={img.id}>
            <img
              src={img.src}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0
              }}
            />

            {/* כפתור מחיקה */}
            <button
              onClick={() => removeImage(img.id)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "red",
                color: "white",
                border: "none",
                padding: 5,
                cursor: "pointer"
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
