import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in apps/web-operations/.env"
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export const uploadFile = async (
  bucket,
  file,
  folder = ""
) => {
  if (!file) {
    return null;
  }

  if (!bucket) {
    throw new Error("Storage bucket name is required.");
  }

  const originalName = String(file.name || "file");
  const fileExt =
    originalName.includes(".")
      ? originalName.split(".").pop().toLowerCase()
      : "";

  const safeBaseName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

  const uniquePart = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  const generatedFileName = `${safeBaseName || "file"}_${uniquePart}${
    fileExt ? `.${fileExt}` : ""
  }`;

  const cleanFolder = String(folder || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  const filePath = cleanFolder
    ? `${cleanFolder}/${generatedFileName}`
    : generatedFileName;

  const { error: uploadError } =
    await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType:
          file.type || "application/octet-stream",
      });

  if (uploadError) {
    throw new Error(
      `File upload failed: ${uploadError.message}`
    );
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error(
      "File uploaded, but its public URL could not be generated."
    );
  }

  return data.publicUrl;
};

export { supabase };
