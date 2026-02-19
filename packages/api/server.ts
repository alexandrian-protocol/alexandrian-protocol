/**
 * Alexandrian API — minimal stub for M1.
 * Serves / and /health so the Docker stack can start.
 * Full ingest/query/ledger in Milestone 2.
 */
import express, { type Express } from "express";
import { fileURLToPath } from "url";

const app: Express = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ service: "alexandrian-api", stub: true });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

/** Stub: all other routes return 503 (not implemented in M1). */
app.use((_req, res) => {
  res.status(503).json({ error: "API stub — full implementation in Milestone 2" });
});

export { app };

export interface CreateServerOptions {
  stub?: boolean;
}

export function createServer(_options?: CreateServerOptions): Express {
  return app;
}

export function isStub(): boolean {
  return true;
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const port = Number(process.env.PORT ?? 3000);
  const server = app.listen(port, () => {
    console.log(`[api] stub listening on ${port}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[api] port ${port} already in use. Set PORT to another value (e.g. PORT=3001) or stop the process using ${port}.`);
      process.exit(1);
    }
    throw err;
  });
}
