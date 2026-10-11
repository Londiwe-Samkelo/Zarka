import countries from "./countries.json";

// Dial codes, number lengths and examples live in lib/countries.json (the server reads the same file).
// The lengths are mobile-number lengths and should be double-checked before real launch.
export const COUNTRIES = countries;
export const SENDER_COUNTRIES = Object.keys(countries);
// Short reference people can read out or text back, from the transfer id
export const transferRef = (id) => String(id).replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase();
export const dialCodeFor = (country) => countries[country]?.dial || "";
// +27821234567 -> +27•••••567 (a number shown to someone else)
export const maskPhone = (phone) => (String(phone).length > 7 ? `${phone.slice(0, 3)}${"•".repeat(Math.max(3, phone.length - 6))}${phone.slice(-3)}` : "•••");
export const exampleFor = (country) => (countries[country] ? `${countries[country].dial} ${countries[country].example}` : "");

// Accepts 0771234567, 771234567, 263771234567, +263771234567 or 00263771234567 for Zimbabwe.
// Returns { phone: "+263771234567" } or { error: "country" | "wrongCountry" | "length" }.
export function normalizePhone(country, input) {
  const info = countries[country];
  if (!info) return { error: "country" };
  let raw = String(input || "").replace(/[\s().-]/g, "");
  if (raw.startsWith("00")) raw = "+" + raw.slice(2);
  const dialDigits = info.dial.slice(1);
  const [minDigits, maxDigits] = info.digits;
  let national;
  if (raw.startsWith("+")) {
    if (!raw.startsWith(info.dial)) return { error: "wrongCountry" }; // a number from a different country
    national = raw.slice(info.dial.length);
  } else if (raw.startsWith(dialDigits) && raw.length - dialDigits.length >= minDigits && raw.length - dialDigits.length <= maxDigits) {
    national = raw.slice(dialDigits.length); // typed 263771234567 without the +
  } else {
    national = raw;
  }
  national = national.replace(/^0+/, ""); // 0771234567 and +263 0771234567 both work
  if (!/^\d+$/.test(national) || national.length < minDigits || national.length > maxDigits) return { error: "length" };
  return { phone: info.dial + national };
}
