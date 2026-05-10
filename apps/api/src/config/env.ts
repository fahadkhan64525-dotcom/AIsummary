import { config } from "dotenv";

config();

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  PORT: toNumber(process.env.PORT, 4000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-5",
  JWT_SECRET: process.env.JWT_SECRET ?? "change-me",
  MONGODB_URI: process.env.MONGODB_URI ?? "",
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME ?? "ai_summary_session",
  MAX_SOURCE_CHARS: toNumber(process.env.MAX_SOURCE_CHARS, 120000)
};

export const isProduction = env.NODE_ENV === "production";

