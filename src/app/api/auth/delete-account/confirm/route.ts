import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUserAccount, hashDeletionToken } from "@/lib/account-deletion";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };

    if (!token) {
      return NextResponse.json({ error: "Deletion token is required" }, { status: 400 });
    }

    const rate = checkRateLimit(getClientKey("delete-account-confirm", req), {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (rate.limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const deletionToken = await prisma.accountDeletionToken.findUnique({
      where: { tokenHash: hashDeletionToken(token) },
    });

    if (!deletionToken || deletionToken.usedAt || deletionToken.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "This deletion link is invalid or has expired" },
        { status: 400 }
      );
    }

    await prisma.accountDeletionToken.update({
      where: { id: deletionToken.id },
      data: { usedAt: new Date() },
    });
    await deleteUserAccount(deletionToken.userId);

    return NextResponse.json({
      ok: true,
      message: "Your account and personal data have been deleted.",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
