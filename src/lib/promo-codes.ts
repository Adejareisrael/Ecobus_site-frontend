import { AppliedPromo, PromoCode } from "./types";

type DbPromoCode = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minSpend: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
};

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

export function formatPromoCode(code: DbPromoCode): PromoCode {
  return {
    id: code.id,
    code: code.code,
    description: code.description,
    discountType: code.discountType === "fixed" ? "fixed" : "percentage",
    discountValue: code.discountValue,
    minSpend: code.minSpend,
    maxUses: code.maxUses,
    usedCount: code.usedCount,
    startsAt: code.startsAt?.toISOString() ?? null,
    expiresAt: code.expiresAt?.toISOString() ?? null,
    isActive: code.isActive,
  };
}

export function calculatePromoDiscount(
  promo: Pick<PromoCode, "discountType" | "discountValue" | "minSpend">,
  total: number
) {
  if (total <= 0 || total < promo.minSpend) return 0;

  const rawDiscount =
    promo.discountType === "percentage"
      ? Math.floor((total * promo.discountValue) / 100)
      : promo.discountValue;

  return Math.max(0, Math.min(total, rawDiscount));
}

export function validatePromoForTotal(
  promo: PromoCode,
  total: number,
  now = new Date()
): AppliedPromo | { error: string } {
  if (!promo.isActive) return { error: "Promo code is not active." };
  if (promo.startsAt && new Date(promo.startsAt) > now) {
    return { error: "Promo code is not active yet." };
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < now) {
    return { error: "Promo code has expired." };
  }
  if (promo.maxUses !== null && promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) {
    return { error: "Promo code has reached its usage limit." };
  }
  if (total < promo.minSpend) {
    return { error: `Promo code requires a minimum spend of ₦${promo.minSpend.toLocaleString()}.` };
  }

  const discountAmount = calculatePromoDiscount(promo, total);
  if (discountAmount <= 0) return { error: "Promo code does not apply to this booking." };

  return {
    code: promo.code,
    description: promo.description,
    discountAmount,
    totalBeforeDiscount: total,
    totalAfterDiscount: total - discountAmount,
  };
}
