import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

// The stored document, served as a document.
//
// The review grid shows two dozen mockups at once. Passing their markup through
// the server component would put well over a megabyte of HTML in the payload of
// a page whose whole job is to be quick to open. An <iframe src> here instead
// lets the browser fetch each one lazily, cache it, and skip the ones scrolled
// past — and it is the same bytes a visitor would get.
//
// Cookie-authenticated, because an <iframe src> cannot carry a header.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminSession())) return new Response("Not authorised", { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("bespoke_homepage_html")
    .eq("lead_id", id)
    .maybeSingle<{ bespoke_homepage_html: string | null }>();

  if (!data?.bespoke_homepage_html) return new Response("Not built yet", { status: 404 });

  return new Response(data.bespoke_homepage_html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Never indexed, never shared — this is an operator view of an unsent page.
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, max-age=60",
    },
  });
}
