import OpenAI from "openai";
import { env } from "../config/env.js";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
  }

  return client;
}

