import { Router } from "express";
import { requestOtp, verifyOtp } from "../services/otpService.js";
import { revokeSession } from "../store/sessionsStore.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { audit } from "../services/auditService.js";

export const authRouter = Router();

export async function handleRequestOtp(req, res) {
  const result = await requestOtp(req.body?.phone);
  res.status(result.error ? 400 : 200).json(result);
}

export function handleVerifyOtp(req, res) {
  const result = verifyOtp(req.body?.phone, req.body?.code);
  res.status(result.error ? 400 : 200).json(result);
}

// Logging out cancels the login on the server too, not just on the phone.
export function handleLogout(req, res) {
  revokeSession(req.user.sessionId);
  audit("logout", { phone: req.user.phone });
  res.json({ ok: true });
}

authRouter.post("/request-otp", handleRequestOtp);
authRouter.post("/verify-otp", handleVerifyOtp);
authRouter.post("/logout", requireAuth, handleLogout);
