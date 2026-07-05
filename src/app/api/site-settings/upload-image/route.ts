import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadPublicImage,
} from "@/lib/supabase-storage";

function extensionFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, or WEBP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image must be smaller than 1.5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `route-images/${crypto.randomUUID()}.${extensionFor(file.type)}`;
    const url = await uploadPublicImage({ buffer, contentType: file.type, path });

    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}
