import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectToDatabase, isDatabaseConfigured } from "./lib/database.js";

async function startServer() {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      console.log("Connected to MongoDB.");
    } catch (error) {
      console.warn("MongoDB connection failed. Falling back to in-memory storage.", error);
    }
  } else {
    console.log("MongoDB not configured. Using in-memory development storage.");
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`API server listening on http://localhost:${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
