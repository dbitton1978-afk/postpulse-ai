import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { generateEngine } from "./services/generateEngine.js";
import { improveEngine } from "./services/improveEngine.js";
import { analyzeEngine } from "./services/analyzeEngine.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: false
  })
);

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  return res.json({
    success: true,
    service: "PostPulse API",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  return res.json({
    success: true,
    status: "ok"
  });
});

app.use("/api/auth", authRoutes);

app.post("/generate-post", async (req, res) => {
  try {
    const data = await generateEngine(req.body || {});
    return res.json({ data });
  } catch (error) {
    console.error("generate-post error:", error);
    return res.status(500).json({
      error: "Generate failed"
    });
  }
});

app.post("/improve-post", async (req, res) => {
  try {
    const data = await improveEngine(req.body || {});
    return res.json({ data });
  } catch (error) {
    console.error("improve-post error:", error);
    return res.status(500).json({
      error: "Improve failed"
    });
  }
});

app.post("/analyze-post", async (req, res) => {
  try {
    const data = await analyzeEngine(req.body || {});
    return res.json({ data });
  } catch (error) {
    console.error("analyze-post error:", error);
    return res.status(500).json({
      error: "Analyze failed"
    });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found"
  });
});

app.listen(PORT, () => {
  console.log(`PostPulse server running on port ${PORT}`);
});
