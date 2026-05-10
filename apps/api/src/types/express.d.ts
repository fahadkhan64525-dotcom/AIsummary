import type { PublicUser } from "./index.js";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser | null;
    }
  }
}

export {};

