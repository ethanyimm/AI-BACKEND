import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import aiRoutes from "./routes/ai.js";
import healthRoutes from "./routes/health.js";

dotenv.config();

const app = express();

// Security + parsing
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

// Logging
app.use(morgan("dev"));

// Routes
app.use("/", healthRoutes);
app.use("/", aiRoutes);

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.publicMessage || "Internal Server Error";
  if (status >= 500) {
    console.error("🔥 Internal error:", err);
  }
  res.status(status).json({ error: message });
});

export default app;