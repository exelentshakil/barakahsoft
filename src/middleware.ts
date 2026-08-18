import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// v4 Phase P1 — custom-domain routing for a lead's own live site, keyed by
// leads.custom_domain, mirroring the rewrite pattern quotehaul used for
// tenants.custom_domain. This is the real precondition for a client's site
// to ever accrue organic Google/Search Console value: a shared
// /s/[leadSlug] path under BarakahSoft's own domain structurally can't rank
// as "the client's business."
function appHostnames(): string[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const hosts = ["localhost:3000", "localhost"];
  if (siteUrl) {
    try {
      hosts.push(new URL(siteUrl).hostname);
    } catch {
      // malformed env var — fall through with just the localhost defaults
    }
  }
  return hosts;
}

async function rewriteForCustomDomain(request: NextRequest): Promise<NextResponse | null> {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (!host || appHostnames().includes(host)) return null;
  if (request.nextUrl.pathname.startsWith("/s/")) return null; // already routed

  // Skip the anon/cookie-bound client entirely — a visitor on a client's
  // own custom domain has no admin session and no need for RLS-scoped
  // reads; this is a trusted server-only lookup of a public routing fact.
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data: lead } = await admin.from("leads").select("slug, status").eq("custom_domain", host).maybeSingle();
  if (!lead || lead.status !== "live") return null;

  const url = request.nextUrl.clone();
  url.pathname = `/s/${lead.slug}${request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  // The visual admin prototype is fixture-only and intentionally public. It
  // must not be caught by the protected `/admin` prefix check below.
  if (request.nextUrl.pathname.startsWith("/admin-prototype")) {
    return NextResponse.next();
  }

  const customDomainRewrite = await rewriteForCustomDomain(request);
  if (customDomainRewrite) return customDomainRewrite;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/admin")) {
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
      .select("email")
      .eq("email", user.email)
      .maybeSingle();

    if (!account) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  // Excludes /s (public generated lead sites) and /api in addition to the
  // usual Next.js internals — those routes are never auth-gated.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|s/).*)"],
};
