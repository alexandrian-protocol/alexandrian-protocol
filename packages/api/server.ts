/**
 * Stub API server for integration tests when @alexandrian/api package is not present.
 * Exports a minimal Express app so test files load; tests that need a real API skip when this stub is used.
 */
process.env.ALEXANDRIAN_API_STUB = "1";
import express from "express";

const app = express();
app.use(express.json());

// Stub routes so supertest doesn't get connection errors; return 503 to indicate API not available
app.use("/api", (_req, res) => {
  res.status(503).json({ error: "API stub: @alexandrian/api not available" });
});

export { app };
