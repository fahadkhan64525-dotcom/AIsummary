import mongoose from "mongoose";
import { env } from "../config/env.js";

let connectionPromise: Promise<typeof mongoose> | null = null;
let databaseAvailable = Boolean(env.MONGODB_URI);
let databaseReady = false;

export function isDatabaseConfigured() {
  return Boolean(env.MONGODB_URI);
}

export async function connectToDatabase() {
  if (!databaseAvailable) {
    return null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGODB_URI)
      .then((connection) => {
        databaseReady = true;
        return connection;
      })
      .catch((error) => {
        databaseAvailable = false;
        databaseReady = false;
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

export async function ensureDatabaseConnection() {
  if (!databaseAvailable) {
    return false;
  }

  if (databaseReady) {
    return true;
  }

  try {
    await connectToDatabase();
    return true;
  } catch {
    return false;
  }
}
