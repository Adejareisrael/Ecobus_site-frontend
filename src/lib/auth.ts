import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

export type JWTPayload = {
  userId: string;
  email: string;
  role: string;
};

export function signToken(payload: JWTPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "7d" });
}

export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  if (!JWT_SECRET) {
    return null;
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET as string) as JWTPayload;
  } catch {
    return null;
  }
}
