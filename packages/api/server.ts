/**
 * Alexandrian API — minimal surface for Docker and health checks.
 * Serves / and /health; other routes return 503 until implemented.
 */
import express, { type Express } from "express";
import { fileURLToPath } from "url";

const app: Express = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ service: "alexandrian-api", minimal: true });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

/** All other routes return 503 (not implemented). */
app.use((_req, res) => {
  res.status(503).json({ error: "Not implemented" });
});

export { app };

export interface CreateServerOptions {
  minimal?: boolean;
}

export function createServer(_options?: CreateServerOptions): Express {
  return app;
}

export function isMinimal(): boolean {
  return true;
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const port = Math.floor(Number(process.env.PORT)) || 3000;
  const server = app.listen(port, () => {
    console.log(`[api] listening on ${port}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[api] port ${port} already in use. Set PORT to another value (e.g. PORT=3001) or stop the process using ${port}.`);
      process.exit(1);
    }
    throw err;
  });
}
