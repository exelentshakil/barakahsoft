import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retouchSlotPhoto } from "@/lib/media/retouch-photo";
import type { Lead, Artifact } from "@/types/database";
import type { MediaPlan } from "@/lib/media/plan-media";

export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: artifact }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("artifacts").select("media_plan").eq("lead_id", leadId).maybeSingle<Artifact>(),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const plan = (artifact?.media_plan as MediaPlan | null) ?? [];
  if (plan.length === 0) {
    return NextResponse.json({ error: "No media plan found to retouch" }, { status: 400 });
  }

  const retouched: string[] = [];
  const errors: string[] = [];

  for (const item of plan) {
    try {
      const result = await retouchSlotPhoto(leadId, item.slot);
      if (result) {
        retouched.push(item.slot);
      }
    } catch (err) {
      console.error(`[retouch-all] failed for slot ${item.slot}`, err);
      errors.push(item.slot);
    }
  }

  return NextResponse.json({
    ok: true,
    retouched,
    errors,
    total: plan.length,
  });
}
