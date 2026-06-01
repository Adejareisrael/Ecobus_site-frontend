import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";

function validateTerminal(input: {
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

  return { name, city, state };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ terminalId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const input = validateTerminal(await req.json());
    if (!input) {
      return NextResponse.json({ error: "Invalid terminal details" }, { status: 400 });
    }

    const { terminalId } = await params;
    const terminal = await prisma.terminal.update({
      where: { id: terminalId },
      data: input,
    });

    return NextResponse.json(terminal);
  } catch {
    return NextResponse.json({ error: "Terminal could not be updated" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ terminalId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const { terminalId } = await params;
    const tripCount = await prisma.trip.count({
      where: {
        OR: [
          { departureTerminalId: terminalId },
          { destinationTerminalId: terminalId },
        ],
      },
    });

    if (tripCount > 0) {
      return NextResponse.json(
        { error: "This terminal is used by trips. Remove those trips first." },
        { status: 409 }
      );
    }

    await prisma.terminal.delete({ where: { id: terminalId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Terminal could not be deleted" }, { status: 500 });
  }
}
