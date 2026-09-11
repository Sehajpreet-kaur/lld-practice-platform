import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import problemRoutes from "./routes/problems.js";
import attemptRoutes from "./routes/attempts.js";
import submissionRoutes from "./routes/submissions.js";

export function createApp() {
  const app = express();
  const allowedOrigin = process.env.FRONTEND_URL;
    app.use(
      cors(
        allowedOrigin
          ? { origin: allowedOrigin, credentials: true }
          : {} // open, for local dev
      )
    );
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/problems", problemRoutes);
  app.use("/api/attempts", attemptRoutes);
  app.use("/api/submissions", submissionRoutes);

  // Centralized error fallback so an unexpected throw never leaks a stack trace.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
