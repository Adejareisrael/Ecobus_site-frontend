import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "site-assets";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are not set"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureBucket(): Promise<void> {
  const supabase = getClient();
  const { data: existing } = await supabase.storage.getBucket(BUCKET);
  if (existing) return;

  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
  });
}

export async function uploadPublicImage(input: {
  buffer: Buffer;
  contentType: string;
  path: string;
}): Promise<string> {
  const supabase = getClient();
  await ensureBucket();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(input.path, input.buffer, {
      contentType: input.contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(input.path);
  return data.publicUrl;
}
