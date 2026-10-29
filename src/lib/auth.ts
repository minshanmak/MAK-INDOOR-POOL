import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "mak_pool_development_jwt_secret_key_32_characters_long_min_security";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export interface SessionPayload {
  userId: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "SUPER_ADMIN" | "POOL_OWNER" | "STAFF";
  permissions: string; // JSON string
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
