import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthResponse, requireAuth } from "@/lib/api-auth";
import { signToken } from "@/lib/auth";

function formatUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (isAuthResponse(auth)) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(formatUser(user));
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (isAuthResponse(auth)) return auth;

    const input = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string | null;
    };

    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone?.trim() || null;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== auth.userId) {
      return NextResponse.json(
        { error: "Another account already uses this email" },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: { name, email, phone },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user: formatUser(user), token });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
