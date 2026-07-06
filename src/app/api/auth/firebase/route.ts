import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };

    if (!idToken) {
      return NextResponse.json({ error: "Firebase ID token is required" }, { status: 400 });
    }

    const rate = checkRateLimit(getClientKey("firebase-auth", req), {
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
      identity = await verifyFirebaseIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Invalid or expired sign-in token" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { email: identity.email } });

    if (!user) {
      // Firebase-authenticated accounts have no password of their own; store an
      // unusable random hash so email/password login can't accidentally work
      // until the user deliberately sets a real password via "forgot password".
      const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      user = await prisma.user.create({
        data: {
          name: identity.name || identity.email.split("@")[0],
          email: identity.email,
          password: unusablePassword,
        },
      });
    }

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
