import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const isUpload = req.headers.get("content-type")?.includes("multipart/form-data");
  const body = isUpload ? null : await req.json().catch(() => null);
  const form = isUpload ? await req.formData().catch(() => null) : null;
  if (!body && !form) return NextResponse.json({ error: "Invalid mockup configuration" }, { status: 400 });

  const admin = createAdminClient();

  try {
    const { data: artifact } = await admin
      .from("artifacts")
      .select("extracted_assets")
      .eq("lead_id", leadId)
      .maybeSingle();

    const existingAssets = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;
    const existingMockup = (existingAssets.mockup ?? {}) as Record<string, unknown>;

    let uploadedCapture: { key: "heroCaptureUrl" | "aboutCaptureUrl"; url: string } | null = null;
    if (form) {
      const slot = form.get("slot");
      const file = form.get("file");
      if ((slot !== "hero" && slot !== "about") || !(file instanceof File)) {
        return NextResponse.json({ error: "Choose a Hero or About image" }, { status: 400 });
      }
      if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) {
        return NextResponse.json({ error: "Capture must be an image smaller than 12 MB" }, { status: 400 });
      }

      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${leadId}/mockup/${slot}-${Date.now()}.${extension}`;
      const { error: uploadError } = await admin.storage
        .from("lead-media")
        .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data } = admin.storage.from("lead-media").getPublicUrl(path);
      uploadedCapture = {
        key: slot === "hero" ? "heroCaptureUrl" : "aboutCaptureUrl",
        url: data.publicUrl,
      };
    }

    const mockupConfig = {
      ...existingMockup,
      ...(body && typeof body.themeId === "string" ? { themeId: body.themeId } : {}),
      ...(body && typeof body.headlineMode === "string" ? { headlineMode: body.headlineMode } : {}),
      ...(body && "heroCaptureUrl" in body ? { heroCaptureUrl: body.heroCaptureUrl || null } : {}),
      ...(body && "aboutCaptureUrl" in body ? { aboutCaptureUrl: body.aboutCaptureUrl || null } : {}),
      ...(uploadedCapture ? { [uploadedCapture.key]: uploadedCapture.url } : {}),
      updated_at: new Date().toISOString(),
      updated_by: user.email,
    };

    const updatedExtractedAssets = {
      ...existingAssets,
      mockup: mockupConfig,
    };

    const { error: artifactError } = await admin
      .from("artifacts")
      .update({
        extracted_assets: updatedExtractedAssets,
        last_edited_at: new Date().toISOString(),
      })
      .eq("lead_id", leadId);

    if (artifactError) throw artifactError;

    return NextResponse.json({ ok: true, mockup: mockupConfig });
  } catch (err) {
    console.error("[mockup-api] failed to update mockup configuration", err);
    return NextResponse.json({ error: "Failed to update mockup configuration" }, { status: 500 });
  }
}
