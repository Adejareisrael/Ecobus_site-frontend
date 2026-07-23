import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDeletionToken, getDeletionConfirmUrl } from "@/lib/account-deletion";
import { sendAccountDeletionEmail } from "@/lib/resend-email";
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
      getClientKey("delete-account", req, normalizedEmail),
      { limit: 5, windowMs: 15 * 60 * 1000 }
    );
    if (rate.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    let confirmUrl: string | undefined;

    if (user) {
      const deletionToken = createDeletionToken();
      await prisma.accountDeletionToken.create({
        data: {
          userId: user.id,
          tokenHash: deletionToken.tokenHash,
          expiresAt: deletionToken.expiresAt,
        },
      });
      confirmUrl = getDeletionConfirmUrl(new URL(req.url).origin, deletionToken.token);

      await sendAccountDeletionEmail({ recipient: normalizedEmail, confirmUrl });
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an Ecobus account exists for that email, we've sent a confirmation link to delete it.",
      ...(process.env.NODE_ENV !== "production" && confirmUrl ? { confirmUrl } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
