import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function validateTerminal(input: {
  id?: string;
  name?: string;
  city?: string;
  state?: string;
}) {
  const name = input.name?.trim();
  const city = input.city?.trim();
  const state = input.state?.trim();

  if (!name || !city || !state) {
    return null;
  }

  return {
    id: input.id?.trim() || `${slugify(city)}-${slugify(name)}`,
    name,
    city,
    state,
  };
}

export async function GET() {
  const terminals = await prisma.terminal.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(terminals, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const terminalInput = validateTerminal(await req.json());
    if (!terminalInput) {
      return NextResponse.json({ error: "Invalid terminal details" }, { status: 400 });
    }

    const terminal = await prisma.terminal.create({ data: terminalInput });
    return NextResponse.json(terminal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terminal could not be created" }, { status: 500 });
  }
}
