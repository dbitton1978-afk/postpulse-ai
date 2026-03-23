import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.send("PostPulse API is running 🚀");
});

app.post("/generate", async (req, res) => {
  try {
    const { topic, language, style } = req.body;

    const prompt = `
Write a social media post.

Language: ${language}
Style: ${style}
Topic: ${topic}

Make it engaging, emotional, and viral.
Return only the post text.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({
      success: true,
      post: response.choices[0].message.content
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error generating post"
    });
  }
});
 
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
