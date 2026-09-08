import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { verifySupabaseGoogleToken } from "@/lib/supabase-auth-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let accessToken: unknown;
  try {
    ({ accessToken } = (await req.json()) as { accessToken?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof accessToken !== "string" || !accessToken.trim()) {
    return NextResponse.json({ error: "Supabase access token is required" }, { status: 400 });
  }
  if (accessToken.length > 16_384) {
    return NextResponse.json({ error: "Invalid sign-in token" }, { status: 400 });
  }

  const rate = checkRateLimit(getClientKey("supabase-auth", req), {
    limit: 15,
    windowMs: 15 * 60 * 1000,
  });
  if (rate.limited) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      { status: 429 }
    );
  }

  let identity;
  try {
    identity = await verifySupabaseGoogleToken(accessToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired sign-in token" }, { status: 401 });
  }

  try {
    const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    const user = await prisma.user.upsert({
      where: { email: identity.email },
      update: {},
      create: {
        name: identity.name || identity.email.split("@")[0],
        email: identity.email,
        password: unusablePassword,
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to complete Google sign-in" }, { status: 500 });
  }
}
