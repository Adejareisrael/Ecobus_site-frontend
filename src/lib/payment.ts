import crypto from "crypto";

export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Abandoned";

export function verifyPaystackSignature(body: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const digest = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export function mapPaystackStatus(status: string): PaymentStatus {
  if (status === "success") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "abandoned") return "Abandoned";
  return "Pending";
}
