import { requireOperator } from "@/lib/tenant-scope";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sweepOrphanedStorage } from "@/lib/supabase/cleanup-storage";

export async function POST() {
  // Being signed in is not being an operator: any Supabase user can
  // complete a magic link. This route then uses the service-role client.
  if (!(await requireOperator())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const admin = createAdminClient();
  const result = await sweepOrphanedStorage(admin);

  return NextResponse.json({
    ok: true,
    message: "Storage swept successfully.",
    ...result,
  });
}
