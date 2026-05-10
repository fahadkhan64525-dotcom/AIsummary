import { type Response, Router } from "express";
import { env, isProduction } from "../config/env.js";
import { createUser, findUserByEmail, toPublicUser, validatePassword } from "../services/auth.service.js";
import { signAuthToken } from "../utils/jwt.js";

const authRoutes = Router();

function setAuthCookie(token: string, response: Response) {
  response.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

authRoutes.get("/me", (request, response) => {
  response.json({
    user: request.user ?? null
  });
});

authRoutes.post("/register", async (request, response) => {
  const { name, email, password } = request.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return response.status(400).json({
      message: "Name, email, and password are required."
    });
  }

  if (password.length < 8) {
    return response.status(400).json({
      message: "Password must be at least 8 characters long."
    });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return response.status(409).json({
      message: "An account with this email already exists."
    });
  }

  const user = await createUser({ name, email, password });
  const token = signAuthToken({
    userId: user.id,
    email: user.email
  });

  setAuthCookie(token, response);

  return response.status(201).json({
    user: toPublicUser(user)
  });
});

authRoutes.post("/login", async (request, response) => {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password?.trim()) {
    return response.status(400).json({
      message: "Email and password are required."
    });
  }

  const user = await findUserByEmail(email);

  if (!user || !(await validatePassword(user, password))) {
    return response.status(401).json({
      message: "Invalid email or password."
    });
  }

  const token = signAuthToken({
    userId: user.id,
    email: user.email
  });

  setAuthCookie(token, response);

  return response.json({
    user: toPublicUser(user)
  });
});

authRoutes.post("/logout", (_request, response) => {
  response.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });

  response.status(204).send();
});

export { authRoutes };
