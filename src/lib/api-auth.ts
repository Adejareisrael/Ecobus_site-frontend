import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, JWTPayload } from "./auth";

export function requireAuth(req: NextRequest): JWTPayload | NextResponse {
  const payload = getTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return payload;
}

export function requireAdmin(req: NextRequest): JWTPayload | NextResponse {
  const payload = requireAuth(req);
  if (payload instanceof NextResponse) return payload;

  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return payload;
}

export function isAuthResponse(
  payload: JWTPayload | NextResponse
): payload is NextResponse {
  return payload instanceof NextResponse;
}
