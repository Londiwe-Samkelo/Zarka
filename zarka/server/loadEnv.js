import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Reads zarka/.env (KEY=value lines) into process.env. Import this first. Real environment variables win.
const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
try {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
} catch { /* no .env file: use the real environment */ }
