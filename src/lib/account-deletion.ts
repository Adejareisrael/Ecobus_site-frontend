import crypto from "crypto";
import { prisma } from "./prisma";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000;

export function createDeletionToken() {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  return {
    token,
    tokenHash: hashDeletionToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  };
}

export function hashDeletionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getDeletionConfirmUrl(origin: string, token: string) {
  return `${origin}/delete-account/confirm?token=${encodeURIComponent(token)}`;
}

/**
 * Deletes a user's account. Bookings and change requests are kept for
 * operational/audit/legal record-keeping (as disclosed in the privacy
 * policy) but detached from the personal account by nulling userId.
 */
export async function deleteUserAccount(userId: string) {
  await prisma.$transaction([
    prisma.booking.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.bookingChangeRequest.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
