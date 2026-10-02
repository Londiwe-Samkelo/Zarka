import { VAMBO, LANGUAGES } from "../config.js";

const translationCache = new Map();

export const isVamboConfigured = () => Boolean(VAMBO.key);
const toVamboCode = (language) => LANGUAGES[language]?.[VAMBO.codeStyle];

// Vambo's reply field names are not confirmed here, so accept the usual ones.
const readTranslation = (data) =>
  data?.translation ?? data?.translated_text ?? data?.output ?? data?.text ?? data?.data?.translation ?? null;

// Returns the translated string, or null if Vambo is not set up or the call failed.
export async function requestTranslation(text, language, source = "en") {
  if (!text || !isVamboConfigured()) return null;
  const from = toVamboCode(source);
  const target = toVamboCode(language);
  if (!from || !target) return null;

  const cacheKey = `${source}>${language}|${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);
  try {
    const response = await fetch(VAMBO.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${VAMBO.key}` },
      body: JSON.stringify({ text, source: from, target }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Vambo answered ${response.status}`);
    const translated = readTranslation(await response.json());
    if (typeof translated !== "string" || !translated.trim()) throw new Error("unexpected Vambo response");
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (error) {
    console.error("Vambo translation failed:", error.message);
    return null;
  }
}

// Backup text: if Vambo cannot translate, the original text is used.
export async function translateText(text, language, source = "en") {
  if (!text || language === source) return text;
  return (await requestTranslation(text, language, source)) ?? text;
}
