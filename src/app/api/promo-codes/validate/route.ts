import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatPromoCode,
  normalizePromoCode,
  validatePromoForTotal,
} from "@/lib/promo-codes";

export async function POST(req: NextRequest) {
  const { code, total } = (await req.json()) as { code?: string; total?: number };
  const normalizedCode = normalizePromoCode(code ?? "");
  const bookingTotal = Number(total);

  if (!normalizedCode || Number.isNaN(bookingTotal) || bookingTotal <= 0) {
    return NextResponse.json({ error: "Enter a valid promo code." }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });
  if (!promo) {
    return NextResponse.json({ error: "Promo code not found." }, { status: 404 });
  }

  const result = validatePromoForTotal(formatPromoCode(promo), bookingTotal);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
