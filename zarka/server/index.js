import "./loadEnv.js"; // must stay first: loads .env before the config reads it
import express from "express";
import { PORT } from "./config.js";
import { apiRouter } from "./routes/apiRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { ussdRouter } from "./routes/ussdRoutes.js";
import { smsRouter } from "./routes/smsRoutes.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { advanceOpenTransfers } from "./services/transfersService.js";

export function startServer() {
  const app = express();
  app.set("trust proxy", true); // the Next.js app forwards the real client IP
  app.use(express.json());
  app.use(express.urlencoded({ extended: false })); // USSD gateways post form data
  app.use("/api", rateLimit);
  app.use("/api/auth", authRouter);
  app.use("/api", apiRouter);
  app.use("/ussd", ussdRouter);
  app.use("/sms", smsRouter);

  setInterval(() => advanceOpenTransfers().catch(console.error), 3000).unref(); // status machine ticker
  return app.listen(PORT, () => console.log(`Zarka API running on http://localhost:${PORT}`));
}

startServer();
