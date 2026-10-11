import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Same data file the app uses (lib/countries.json), so dial codes live in one place.
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "lib", "countries.json");
const countries = JSON.parse(fs.readFileSync(file, "utf8"));

export const dialCodeFor = (country) => countries[country]?.dial || "";
export const exampleFor = (country) => (countries[country] ? `${countries[country].dial} ${countries[country].example}` : "");

// Same rules as lib/phone.js. Returns "+263771234567" or null.
export function normalizeNumberForCountry(country, input) {
  const info = countries[country];
  if (!info) return null;
  let raw = String(input || "").replace(/[\s().-]/g, "");
  if (raw.startsWith("00")) raw = "+" + raw.slice(2);
  const dialDigits = info.dial.slice(1);
  const [minDigits, maxDigits] = info.digits;
  let national;
  if (raw.startsWith("+")) {
    if (!raw.startsWith(info.dial)) return null; // a number from a different country
    national = raw.slice(info.dial.length);
  } else if (raw.startsWith(dialDigits) && raw.length - dialDigits.length >= minDigits && raw.length - dialDigits.length <= maxDigits) {
    national = raw.slice(dialDigits.length); // typed 263771234567 without the +
  } else {
    national = raw;
  }
  national = national.replace(/^0+/, ""); // 0771234567 and +263 0771234567 both work
  if (!/^\d+$/.test(national) || national.length < minDigits || national.length > maxDigits) return null;
  return info.dial + national;
}

// +27821234567 -> +27•••••567 (for logs and for showing a number to someone else)
export function maskPhone(phone) {
  const p = String(phone || "");
  return p.length > 7 ? `${p.slice(0, 3)}${"•".repeat(Math.max(3, p.length - 6))}${p.slice(-3)}` : "•••";
}
