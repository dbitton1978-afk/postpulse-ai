import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { generateEngine } from "./services/generateEngine.js";
import { improveEngine } from "./services/improveEngine.js";
import { analyzeEngine } from "./services/analyzeEngine.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* ---------- ROUTES ---------- */

app.post("/generate-post", async (req, res) => {
  try {
    const data = await generateEngine(req.body);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Generate failed" });
  }
});

app.post("/improve-post", async (req, res) => {
  try {
    const data = await improveEngine(req.body);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Improve failed" });
  }
});

app.post("/analyze-post", async (req, res) => {
  try {
    const data = await analyzeEngine(req.body);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Analyze failed" });
  }
});

/* ---------- HEALTH ---------- */

app.get("/", (req, res) => {
  res.send("PostPulse API Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
