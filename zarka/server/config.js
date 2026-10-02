export const PORT = process.env.API_PORT || 4000; // the Next.js app proxies /api/* here

// Demo rates per R1 (ZAR). Replace with a real rates source.
export const RATES = {
  Zimbabwe: { currency: "USD", rate: 0.055 },
  Mozambique: { currency: "MZN", rate: 3.5 },
  Malawi: { currency: "MWK", rate: 95 },
  Lesotho: { currency: "LSL", rate: 1 },
  Botswana: { currency: "BWP", rate: 0.75 },
  Namibia: { currency: "NAD", rate: 1 },
  Zambia: { currency: "ZMW", rate: 1.3 },
};

export const FEE = { minimumZar: 25, percent: 0.03 };

// Mock status machine: received -> processing -> ready to collect (time based, for the MVP).
export const STATUS_TIMING_MS = { processing: 5000, ready: 15000 };
export const RATE_LIMIT = { windowMs: 60 * 1000, max: 120 };
// Vambo AI. Endpoint and request shape follow Vambo's developer page; confirm them in your dashboard with `npm run vambo:test`.
export const VAMBO = {
  url: process.env.VAMBO_API_URL || "https://api.vambo.ai/v1/translate",
  key: process.env.VAMBO_API_KEY,
  codeStyle: process.env.VAMBO_CODE_STYLE || "iso3", // "iso3" = sna, zul (Vambo docs). Use "iso1" = sn, zu if your account expects two-letter codes.
};

// App language code -> Vambo language codes.
export const LANGUAGES = {
  en: { name: "English", iso3: "eng", iso1: "en" },
  sn: { name: "Shona", iso3: "sna", iso1: "sn" },
  zu: { name: "Zulu", iso3: "zul", iso1: "zu" },
  xh: { name: "Xhosa", iso3: "xho", iso1: "xh" },
  af: { name: "Afrikaans", iso3: "afr", iso1: "af" },
  st: { name: "Southern Sotho", iso3: "sot", iso1: "st" },   // needs "next mode" in Vambo settings
  tn: { name: "Tswana", iso3: "tsn", iso1: "tn" },           // needs "next mode"
  ts: { name: "Tsonga", iso3: "tso", iso1: "ts" },           // needs "next mode"
  ny: { name: "Nyanja", iso3: "nya", iso1: "ny" },           // needs "next mode"
  ss: { name: "Swati", iso3: "ssw", iso1: "ss" },            // needs "next mode"
};

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const AUTH = {
  secret: process.env.AUTH_SECRET || "dev-only-secret-change-me", // set AUTH_SECRET in production
  tokenTtlMs: 30 * 24 * 60 * 60 * 1000,
  otpTtlMs: 5 * 60 * 1000,
  otpMaxAttempts: 5,
};
export const SMS_COUNTRY_CODES = {
  ZW: "Zimbabwe", MZ: "Mozambique", MW: "Malawi", LS: "Lesotho", BW: "Botswana", NA: "Namibia", ZM: "Zambia",
};
