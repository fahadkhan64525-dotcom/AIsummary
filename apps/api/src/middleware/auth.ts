import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { findUserById, toPublicUser } from "../services/auth.service.js";
import { verifyAuthToken } from "../utils/jwt.js";

function getTokenFromRequest(request: Request) {
  const cookieToken = request.cookies?.[env.AUTH_COOKIE_NAME];

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

export async function attachUserIfPresent(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      request.user = null;
      return next();
    }

    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.userId);
    request.user = user ? toPublicUser(user) : null;
    next();
  } catch {
    request.user = null;
    next();
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  if (!request.user) {
    return response.status(401).json({
      message: "Sign in to access saved history."
    });
  }

  return next();
}

