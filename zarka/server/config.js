import path from "node:path";
import { fileURLToPath } from "node:url";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const PORT = process.env.API_PORT || 4000; // the Next.js app proxies /api/* here
export const DATA_DIR = process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "data");

const num = (name, fallback) => (process.env[name] !== undefined ? Number(process.env[name]) : fallback);

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

// Mock status machine: received -> processing -> ready to collect -> collected.
export const STATUS_TIMING_MS = { processing: num("STATUS_PROCESSING_MS", 5000), ready: num("STATUS_READY_MS", 15000) };
export const TICK_MS = num("TICK_MS", 3000);

// Demo limits. Real limits come from your licensed partner and the regulator.
export const LIMITS = { minZar: 50, maxZar: 5000, dailyZar: 10000, maxPerHour: 5 };
export const LIMIT_VARS = { min: LIMITS.minZar, max: LIMITS.maxZar, daily: LIMITS.dailyZar }; // names used inside message text

export const RATE_LIMIT = { windowMs: 60 * 1000, max: 120 };
export const AUTH_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 30 };

const DEV_SECRET = "dev-only-secret-change-me";
export const AUTH = {
  secret: process.env.AUTH_SECRET || DEV_SECRET,
  tokenTtlMs: 7 * 24 * 60 * 60 * 1000,
  otpTtlMs: 5 * 60 * 1000,
  otpMaxAttempts: 5,
  otpResendMs: num("OTP_RESEND_MS", 30000),
  otpPerHour: 5,
};
if (IS_PRODUCTION && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
  throw new Error("Refusing to start in production without AUTH_SECRET (32 or more characters).");
}

export const PIN = { maxAttempts: 3, lockMs: num("PIN_LOCK_MS", 15 * 60 * 1000) };
export const PICKUP = { maxAttempts: 3, lockMs: num("PICKUP_LOCK_MS", 15 * 60 * 1000) };

// Your USSD/SMS provider must send this value in the x-gateway-secret header when it calls /ussd and /sms.
export const GATEWAY_SECRET = process.env.GATEWAY_SECRET;
export const TRUST_PROXY = num("TRUST_PROXY", 1); // number of proxies in front of the API (Next.js counts as 1)

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

// Country codes people type in an SMS: SEND ZW 500 0771234567
export const SMS_COUNTRY_CODES = {
  ZW: "Zimbabwe", MZ: "Mozambique", MW: "Malawi", LS: "Lesotho", BW: "Botswana", NA: "Namibia", ZM: "Zambia",
};
