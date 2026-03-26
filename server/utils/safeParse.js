export function safeJsonParse(text, fallback = {}) {
  if (typeof text !== "string" || !text.trim()) {
    return fallback;
  }

  const cleanText = text.trim();

  try {
    return JSON.parse(cleanText);
  } catch {}

  const fencedMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {}
  }

  const objectMatch = cleanText.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {}
  }

  const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
  if (arrayMatch?.[0]) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {}
  }

  try {
    const normalized = cleanText
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\r/g, "")
      .trim();

    const secondObjectMatch = normalized.match(/\{[\s\S]*\}/);
    if (secondObjectMatch?.[0]) {
      return JSON.parse(secondObjectMatch[0]);
    }
  } catch {}

  return fallback;
}
