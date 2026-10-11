import "./loadEnv.js"; // must stay first: loads .env before the config reads it
import express from "express";
import helmet from "helmet";
import { PORT, TICK_MS, TRUST_PROXY, GATEWAY_SECRET, IS_PRODUCTION } from "./config.js";
import { apiRouter } from "./routes/apiRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { ussdRouter } from "./routes/ussdRoutes.js";
import { smsRouter } from "./routes/smsRoutes.js";
import { simRouter } from "./routes/simRoutes.js";
import { rateLimit, authRateLimit } from "./middleware/rateLimit.js";
import { advanceOpenTransfers } from "./services/transfersService.js";
import { SMS_SIMULATED } from "./services/smsService.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", TRUST_PROXY); // how many proxies sit in front of us (the Next.js app counts as 1)
  app.use(helmet()); // security headers, and hides "x-powered-by"
  app.use(express.json({ limit: "20kb" }));
  app.use(express.urlencoded({ extended: false, limit: "20kb" })); // USSD gateways post form data
  app.use("/api", rateLimit);
  app.use("/api/auth", authRateLimit, authRouter);
  app.use("/api", apiRouter);
  app.use("/ussd", ussdRouter);
  app.use("/sms", smsRouter);
  if (SMS_SIMULATED) app.use("/sim", simRouter); // demo phone only, off against a real provider

  app.use((_req, res) => res.status(404).json({ error: "not found" }));
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500) console.error("Server error:", error.message);
    res.status(status).json({ error: status >= 500 ? "something went wrong" : "bad request" }); // never leak details
  });
  return app;
}

export function startServer() {
  if (IS_PRODUCTION && !GATEWAY_SECRET && !SMS_SIMULATED) console.warn("Warning: set GATEWAY_SECRET so only your phone-network provider can call /ussd and /sms.");
  const server = createApp().listen(PORT, () => console.log(`Zarka API running on http://localhost:${PORT}`));
  setInterval(() => advanceOpenTransfers().catch(console.error), TICK_MS).unref(); // status machine ticker
  return server;
}

startServer();
