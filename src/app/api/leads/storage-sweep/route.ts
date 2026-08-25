import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sweepOrphanedStorage } from "@/lib/supabase/cleanup-storage";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const result = await sweepOrphanedStorage(admin);

  return NextResponse.json({
    ok: true,
    message: "Storage swept successfully.",
    ...result,
  });
}
