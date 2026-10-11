import crypto from "node:crypto";
import { promisify } from "node:util";
import { PIN } from "../config.js";
import { getProfile, updateProfile } from "../store/profilesStore.js";
import { audit } from "./auditService.js";

const scrypt = promisify(crypto.scrypt);
const hashPin = async (pin, salt) => (await scrypt(pin, salt, 32)).toString("hex");

const EASY_PINS = new Set(["1234", "4321", "2580", "0852", "1212", "2020", "1004", "6969"]);
export const isStrongPin = (pin) => /^\d{4}$/.test(pin) && !/^(\d)\1{3}$/.test(pin) && !EASY_PINS.has(pin);

export const hasPin = (phone) => Boolean(getProfile(phone).pin);

export async function setPin(phone, pin) {
  if (!isStrongPin(pin)) return { error: "weak_pin" };
  const salt = crypto.randomBytes(16).toString("hex");
  updateProfile(phone, { pin: { salt, hash: await hashPin(pin, salt) }, pinFails: 0, pinLockedUntil: 0 });
  audit("pin_set", { phone });
  return { ok: true };
}

// Wrong PINs are counted. After PIN.maxAttempts the PIN is locked for PIN.lockMs.
export async function verifyPin(phone, pin) {
  const profile = getProfile(phone);
  if (!profile.pin) return { error: "no_pin" };
  if ((profile.pinLockedUntil || 0) > Date.now()) {
    return { error: "locked", minutes: Math.ceil((profile.pinLockedUntil - Date.now()) / 60000) };
  }
  const given = Buffer.from(await hashPin(String(pin), profile.pin.salt), "hex");
  if (crypto.timingSafeEqual(given, Buffer.from(profile.pin.hash, "hex"))) {
    updateProfile(phone, { pinFails: 0, pinLockedUntil: 0 });
    return { ok: true };
  }
  const fails = (profile.pinFails || 0) + 1;
  if (fails >= PIN.maxAttempts) {
    updateProfile(phone, { pinFails: 0, pinLockedUntil: Date.now() + PIN.lockMs });
    audit("pin_locked", { phone });
    return { error: "locked", minutes: Math.ceil(PIN.lockMs / 60000) };
  }
  updateProfile(phone, { pinFails: fails });
  audit("pin_failed", { phone });
  return { error: "wrong_pin", attemptsLeft: PIN.maxAttempts - fails };
}
