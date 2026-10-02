import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGES } from "../config.js";
import { isVamboConfigured, requestTranslation } from "./vamboService.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceFile = path.join(here, "..", "..", "lib", "messages", "en.json"); // same English file the app uses
const cacheDir = path.join(here, "..", "data", "translations");
const BATCH_SIZE = 6;
const inFlight = new Map(); // language -> promise, so two phones do not trigger two translation runs

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };

async function buildMessages(language) {
  const source = readJson(sourceFile) || {};
  const cacheFile = path.join(cacheDir, `${language}.json`);
  const cached = readJson(cacheFile) || {};
  const entries = {}; // key -> { source, text }
  let complete = true;

  const todo = [];
  for (const [key, text] of Object.entries(source)) {
    if (cached[key]?.source === text) entries[key] = cached[key]; // unchanged since last time
    else todo.push([key, text]);
  }
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(([, text]) => requestTranslation(text, language)));
    batch.forEach(([key, text], j) => {
      if (results[j]) entries[key] = { source: text, text: results[j] };
      else complete = false; // that string stays in English on the phone
    });
  }
  if (todo.length) {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(entries, null, 2));
  }
  return { language, complete, messages: Object.fromEntries(Object.entries(entries).map(([key, e]) => [key, e.text])) };
}

export async function getUiMessages(language) {
  if (!LANGUAGES[language] || language === "en") return { status: 400, error: "unsupported language" };
  if (!isVamboConfigured()) return { status: 503, error: "Vambo AI is not configured (set VAMBO_API_KEY)" };
  if (!inFlight.has(language)) inFlight.set(language, buildMessages(language).finally(() => inFlight.delete(language)));
  const result = await inFlight.get(language);
  return Object.keys(result.messages).length ? result : { status: 502, error: "Vambo AI did not return any text" };
}
