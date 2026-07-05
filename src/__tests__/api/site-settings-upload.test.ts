import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as uploadImage } from "@/app/api/site-settings/upload-image/route";
import { createAdmin, createUser } from "../test-utils";

vi.mock("@/lib/supabase-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-storage")>();
  return {
    ...actual,
    uploadPublicImage: vi.fn(async () => "https://project.supabase.co/storage/v1/object/public/site-assets/route-images/test.jpg"),
  };
});

function fileRequest(token: string | undefined, file: File | null): NextRequest {
  const formData = new FormData();
  if (file) formData.append("file", file);

  return new Request("http://localhost:3000/api/site-settings/upload-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }) as unknown as NextRequest;
}

describe("POST /api/site-settings/upload-image", () => {
  it("rejects unauthenticated requests", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "route.jpg", { type: "image/jpeg" });
    const res = await uploadImage(fileRequest(undefined, file));
    expect(res.status).toBe(401);
  });

  it("rejects non-admin requests", async () => {
    const { token } = await createUser();
    const file = new File([new Uint8Array([1, 2, 3])], "route.jpg", { type: "image/jpeg" });
    const res = await uploadImage(fileRequest(token, file));
    expect(res.status).toBe(403);
  });

  it("rejects requests with no file", async () => {
    const { token } = await createAdmin();
    const res = await uploadImage(fileRequest(token, null));
    expect(res.status).toBe(400);
  });

  it("rejects disallowed file types", async () => {
    const { token } = await createAdmin();
    const file = new File([new Uint8Array([1, 2, 3])], "route.gif", { type: "image/gif" });
    const res = await uploadImage(fileRequest(token, file));
    expect(res.status).toBe(400);
  });

  it("rejects files over 1.5MB", async () => {
    const { token } = await createAdmin();
    const oversized = new Uint8Array(1.5 * 1024 * 1024 + 1);
    const file = new File([oversized], "route.jpg", { type: "image/jpeg" });
    const res = await uploadImage(fileRequest(token, file));
    expect(res.status).toBe(400);
  });

  it("uploads a valid image and returns a public URL", async () => {
    const { token } = await createAdmin();
    const file = new File([new Uint8Array([1, 2, 3])], "route.jpg", { type: "image/jpeg" });
    const res = await uploadImage(fileRequest(token, file));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.url).toContain("https://");
    expect(data.url.length).toBeLessThan(2048);
  });
});
