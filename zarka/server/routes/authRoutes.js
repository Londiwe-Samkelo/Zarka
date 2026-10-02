import { Router } from "express";
import { requestOtp, verifyOtp } from "../services/otpService.js";

export const authRouter = Router();

export async function handleRequestOtp(req, res) {
  const result = await requestOtp(req.body?.phone);
  res.status(result.error ? 400 : 200).json(result);
}

export function handleVerifyOtp(req, res) {
  const result = verifyOtp(req.body?.phone, req.body?.code);
  res.status(result.error ? 400 : 200).json(result);
}

authRouter.post("/request-otp", handleRequestOtp);
authRouter.post("/verify-otp", handleVerifyOtp);
