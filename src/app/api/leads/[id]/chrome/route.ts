import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

// The header and footer, as data.
//
// They are not part of the generated HTML and cannot be: sanitizeBespokeHtml
// strips header, footer, nav and form outright, because model-authored
// chrome is how a site ends up linking at pages that were never built and
// how tracked call buttons quietly stop being tracked. They are reviewed
// React components driven by this spec instead.
//
// So the editable unit is the spec, not markup. Everything here changes what
// the real header and footer render — archetype, whether the utility bar and
// dropdowns appear, whether the footer repeats the call to action — and none
// of it can produce a broken link or an untracked button.

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("artifacts")
    .select("chrome_spec")
    .eq("lead_id", id)
    .maybeSingle<{ chrome_spec: unknown }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chromeSpec: data?.chrome_spec ?? null });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const spec = body?.chromeSpec;
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    return NextResponse.json({ error: "chromeSpec must be an object" }, { status: 400 });
  }
  if (!spec.nav || !spec.footer) {
    // Saving half a spec renders a header with no configuration at all,
    // which fails at request time rather than here where it can be explained.
    return NextResponse.json({ error: "chromeSpec needs both a nav and a footer object." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("artifacts").update({ chrome_spec: spec }).eq("lead_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
