import OpenAI from "openai";
import { safeJsonParse } from "../utils/safeParse.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEngine(input) {
  const { topic, targetAudience, goal, style, platform } = input;

  const prompt = `
You are an elite viral content strategist.

Create a HIGH QUALITY post:
- human tone
- strong hook
- emotional trigger
- no AI feel
- platform optimized

Topic: ${topic}
Audience: ${targetAudience}
Goal: ${goal}
Style: ${style}
Platform: ${platform}

Return JSON:
{
  "title": "",
  "hook": "",
  "body": "",
  "cta": "",
  "hashtags": [],
  "shortVersion": "",
  "alternativeVersion": ""
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.75
  });

  const text = response.choices[0].message.content;
  return safeJsonParse(text);
}
