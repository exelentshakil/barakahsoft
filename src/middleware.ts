import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_TENANT, isAppHost, resolveTenantByHost } from "@/tenants";
import { LIVE_SITE_HEADER, TENANT_HEADER } from "@/lib/tenant";

// v4 Phase P1 — custom-domain routing for a lead's own live site, keyed by
// leads.custom_domain, mirroring the rewrite pattern quotehaul used for
// tenants.custom_domain. This is the real precondition for a client's site
// to ever accrue organic Google/Search Console value: a shared
// /s/[leadSlug] path under BarakahSoft's own domain structurally can't rank
// as "the client's business."
async function rewriteForCustomDomain(request: NextRequest): Promise<NextResponse | null> {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  // An app host belongs to one of our own brands; only a client's own domain
  // gets rewritten. isAppHost knows every tenant's hosts, where this used to
  // know one NEXT_PUBLIC_SITE_URL and therefore treated a partner's domain as
  // a client site.
  if (!host || isAppHost(host)) return null;
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/s/")) return null; // already routed
  // An API call is never a page to rewrite. The matcher now covers /api so
  // route handlers can read the tenant header, and without this guard a form
  // POST from a client's own domain to /api/s/<slug>/quote-request would be
  // rewritten to /s/<lead>/api/s/<slug>/quote-request and 404.
  if (pathname.startsWith("/api/")) return null;

  // Skip the anon/cookie-bound client entirely — a visitor on a client's
  // own custom domain has no admin session and no need for RLS-scoped
  // reads; this is a trusted server-only lookup of a public routing fact.
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data: lead } = await admin
    .from("leads")
    .select("slug, status, tenant_slug")
    .eq("custom_domain", host)
    .maybeSingle<{ slug: string; status: string; tenant_slug: string | null }>();
  if (!lead || lead.status !== "live") return null;

  const url = request.nextUrl.clone();
  url.pathname = `/s/${lead.slug}${pathname}`;
  // The brand comes from the LEAD, not the host: a client's own domain belongs
  // to whoever sold it. Without this the delivered site's portal links, footer
  // and "powered by" would carry the default brand rather than the seller's.
  const headers = new Headers(request.headers);
  headers.set(TENANT_HEADER, lead.tenant_slug ?? DEFAULT_TENANT.slug);
  // This request is for the client's WEBSITE, not for the proposal we sold
  // them with. /s/[leadSlug] serves both — the proposal by default, the site
  // under ?view=preview — and the rewrite carried no marker, so the first
  // client to point their domain here would have served their customers the
  // sales pitch aimed at the client, with the site's structured data on the
  // branch nobody reached.
  headers.set(LIVE_SITE_HEADER, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

export async function middleware(request: NextRequest) {
  // The visual admin prototype is fixture-only and intentionally public. It
  // must not be caught by the protected `/admin` prefix check below.
  if (request.nextUrl.pathname.startsWith("/admin-prototype")) {
    return NextResponse.next();
  }

  const customDomainRewrite = await rewriteForCustomDomain(request);
  if (customDomainRewrite) return customDomainRewrite;

  // Which brand is this? A static map lookup, no database, no cache to warm.
  const tenant = resolveTenantByHost(request.headers.get("host"));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_HEADER, tenant.slug);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Everything below authenticates, and `/admin` is the only authenticated
  // surface the matcher covers. Calling auth.getUser() unconditionally cost a
  // Supabase round-trip on every marketing page view to produce a `user` that
  // only the `/admin` branch ever read.
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return response;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Any Supabase user can complete a magic-link sign-in — being logged in
  // is not being authorized. `accounts` is the allowlist; add/remove
  // operators directly in Supabase (insert/delete a row by email).
  const { data: account } = await supabase
    .from("accounts")
    .select("email, tenant_slug")
    .eq("email", user.email)
    .eq("tenant_slug", tenant.slug)
    .maybeSingle();

  if (!account) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "not_authorized");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // /api and /s are included so a route handler and a delivered client site
  // both know which brand they are serving. They are not auth-gated by this —
  // the session check below runs only for /admin — so the cost on those paths
  // is one in-memory host lookup.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
