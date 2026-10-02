import "../loadEnv.js";
import { VAMBO, LANGUAGES } from "../config.js";
import { requestTranslation } from "../services/vamboService.js";

// Usage: npm run vambo:test -- sn "Send money home, easily"
const language = process.argv[2] || "sn";
const text = process.argv[3] || "Send money home, easily";

if (!VAMBO.key) {
  console.log("No VAMBO_API_KEY found. Copy .env.example to .env and add your key first.");
  process.exit(1);
}
const target = LANGUAGES[language]?.[VAMBO.codeStyle];
console.log(`POST ${VAMBO.url}\n  text: "${text}"\n  source: ${LANGUAGES.en[VAMBO.codeStyle]}  target: ${target}  (code style: ${VAMBO.codeStyle})\n`);

const raw = await fetch(VAMBO.url, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${VAMBO.key}` },
  body: JSON.stringify({ text, source: LANGUAGES.en[VAMBO.codeStyle], target }),
}).catch((error) => ({ status: "network error", text: async () => error.message }));
console.log("Vambo answered:", raw.status, "\n" + (await raw.text()) + "\n");

const result = await requestTranslation(text, language);
console.log(result ? `Zarka reads it as: "${result}"` : "Zarka could not read a translation from that reply. Check the field names in readTranslation() in server/services/vamboService.js.");
