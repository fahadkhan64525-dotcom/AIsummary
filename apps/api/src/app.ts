import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { attachUserIfPresent } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { summaryRoutes } from "./routes/summary.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL.split(",").map((origin) => origin.trim()),
      credentials: true
    })
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(attachUserIfPresent);

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      mode: env.OPENAI_API_KEY ? "openai" : "local-fallback"
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/summaries", summaryRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

