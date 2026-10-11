import crypto from "node:crypto";
import { GATEWAY_SECRET, IS_PRODUCTION } from "../config.js";
import { SMS_SIMULATED } from "../services/smsService.js";

// /ussd and /sms are called by your phone-network provider, not by browsers.
// When GATEWAY_SECRET is set, the provider must send it in the x-gateway-secret header.
export function requireGateway(req, res, next) {
  if (!GATEWAY_SECRET) {
    if (IS_PRODUCTION && !SMS_SIMULATED) return res.status(503).json({ error: "gateway secret is not configured" });
    return next();
  }
  const given = Buffer.from(req.get("x-gateway-secret") || "");
  const expected = Buffer.from(GATEWAY_SECRET);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return res.status(401).json({ error: "unauthorised gateway" });
  next();
}
