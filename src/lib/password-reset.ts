import crypto from "crypto";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000;

export function createResetToken() {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  };
}

export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include letters and numbers";
  }

  return null;
}

export function getResetUrl(origin: string, token: string) {
  return `${origin}/reset-password?token=${encodeURIComponent(token)}`;
}
