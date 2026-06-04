import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResetToken, getResetUrl } from "@/lib/password-reset";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const rate = checkRateLimit(
      getClientKey("forgot-password", req, normalizedEmail),
      { limit: 5, windowMs: 15 * 60 * 1000 }
    );
    if (rate.limited) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    let resetUrl: string | undefined;

    if (user) {
      const resetToken = createResetToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: resetToken.tokenHash,
          expiresAt: resetToken.expiresAt,
        },
      });
      resetUrl = getResetUrl(new URL(req.url).origin, resetToken.token);
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an Ecobus account exists for that email, password reset instructions will be sent.",
      ...(process.env.NODE_ENV !== "production" && resetUrl ? { resetUrl } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
