import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

// The reference screenshot a section is rebuilt against.
//
// Sending the image inline as a data URL works, but it puts a multi-megabyte
// base64 string in the request body on every attempt and keeps nothing the
// operator can point at afterwards. Storing it means the retry is a URL.
//
// One path per lead, overwritten every time. A reference image is scratch
// input for the next rebuild, not an asset worth keeping — accumulating one
// per attempt would grow the bucket forever for files nobody opens twice.

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach an image file." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: `${file.type || "That file"} is not a supported image (PNG, JPEG, WebP or GIF).` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is over 8MB — export it smaller." }, { status: 413 });
  }

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  // Extension follows the mime type so the stored object is served correctly
  // regardless of what the uploaded file was called.
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${id}/reference.${ext}`;

  const { error } = await admin.storage.from("lead-media").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
    // Deliberately not cached: the same path holds a different image after
    // every upload, and a cached copy would send the model the last one.
    cacheControl: "0",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Any older reference in a different format would otherwise linger unused.
  const others = ["png", "jpg", "webp", "gif"].filter((e) => e !== ext).map((e) => `${id}/reference.${e}`);
  await admin.storage.from("lead-media").remove(others);

  const { data } = admin.storage.from("lead-media").getPublicUrl(path);
  return NextResponse.json({ url: `${data.publicUrl}?v=${Date.now()}`, name: file.name, bytes: file.size });
}
