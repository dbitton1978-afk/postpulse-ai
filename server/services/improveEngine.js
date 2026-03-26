import OpenAI from "openai";
import { safeJsonParse } from "../utils/safeParse.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function improveEngine(input) {
  const { post, goal, style, platform } = input;

  const prompt = `
You are a professional content editor.

Improve this post:

${post}

Goal: ${goal}
Style: ${style}
Platform: ${platform}

Make it:
- more human
- clearer
- more engaging
- less AI-like

Return JSON:
{
  "improvedPost": "",
  "moreViralVersion": "",
  "moreAuthenticVersion": "",
  "strengths": [],
  "weaknesses": [],
  "tips": []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const text = response.choices[0].message.content;
  return safeJsonParse(text);
}
