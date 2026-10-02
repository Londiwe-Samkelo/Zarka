import { verifyToken } from "../services/authService.js";

export function requireAuth(req, res, next) {
  const session = verifyToken((req.get("authorization") || "").replace(/^Bearer /, ""));
  if (!session) return res.status(401).json({ error: "login required" });
  req.user = { phone: session.phone };
  next();
}
