import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { formatPromoCode, normalizePromoCode } from "@/lib/promo-codes";
import { PromoCode } from "@/lib/types";

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validatePromoInput(input: Partial<PromoCode>) {
  if (!input.code || !input.discountType || !input.discountValue) return null;
  if (!["percentage", "fixed"].includes(input.discountType)) return null;

  const discountValue = Number(input.discountValue);
  const minSpend = Number(input.minSpend ?? 0);
  const maxUses =
    input.maxUses === null || input.maxUses === undefined || input.maxUses === 0
      ? null
      : Number(input.maxUses);

  if (
    Number.isNaN(discountValue) ||
    discountValue <= 0 ||
    Number.isNaN(minSpend) ||
    minSpend < 0 ||
    (maxUses !== null && (Number.isNaN(maxUses) || maxUses <= 0))
  ) {
    return null;
  }

  if (input.discountType === "percentage" && discountValue > 100) return null;

  return {
    code: normalizePromoCode(input.code),
    description: input.description?.trim() || null,
    discountType: input.discountType,
    discountValue,
    minSpend,
    maxUses,
    startsAt: parseDate(input.startsAt),
    expiresAt: parseDate(input.expiresAt),
    isActive: input.isActive ?? true,
  };
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const promoCodes = await prisma.promoCode.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(promoCodes.map(formatPromoCode));
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const input = validatePromoInput((await req.json()) as Partial<PromoCode>);
    if (!input) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    const promo = await prisma.promoCode.create({ data: input });
    return NextResponse.json(formatPromoCode(promo), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Promo code already exists or could not be saved" }, { status: 400 });
  }
}
