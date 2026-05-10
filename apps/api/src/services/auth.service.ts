import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { ensureDatabaseConnection } from "../lib/database.js";
import { memoryStore } from "../lib/memory-store.js";
import { UserModel } from "../models/User.js";
import type { PublicUser, StoredUser } from "../types/index.js";

function mapUser(record: {
  _id?: Types.ObjectId;
  id?: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date | string;
}): StoredUser {
  return {
    id: record.id ?? record._id?.toString() ?? randomUUID(),
    name: record.name,
    email: record.email,
    passwordHash: record.passwordHash,
    createdAt:
      record.createdAt instanceof Date ? record.createdAt.toISOString() : new Date(record.createdAt).toISOString()
  };
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await ensureDatabaseConnection()) {
    const doc = await UserModel.findOne({ email: normalizedEmail });
    return doc ? mapUser(doc.toObject() as Parameters<typeof mapUser>[0]) : null;
  }

  return [...memoryStore.users.values()].find((user) => user.email === normalizedEmail) ?? null;
}

export async function findUserById(userId: string) {
  if (await ensureDatabaseConnection()) {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const doc = await UserModel.findById(userId);
    return doc ? mapUser(doc.toObject() as Parameters<typeof mapUser>[0]) : null;
  }

  return memoryStore.users.get(userId) ?? null;
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const normalizedEmail = input.email.trim().toLowerCase();

  if (await ensureDatabaseConnection()) {
    const doc = await UserModel.create({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash
    });

    return mapUser(doc.toObject() as Parameters<typeof mapUser>[0]);
  }

  const user: StoredUser = {
    id: randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  memoryStore.users.set(user.id, user);
  return user;
}

export async function validatePassword(user: StoredUser, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}
