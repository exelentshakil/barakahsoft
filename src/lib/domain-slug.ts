import { SupabaseClient } from "@supabase/supabase-js";

export function cleanDomainSlug(url: string): string {
  try {
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const host = new URL(cleanUrl).hostname.replace(/^www\./i, "");
    const parts = host.split(".");
    
    // e.g., "beqyzifar.co" -> "beqyzifar", "spennatoroofing.com" -> "spennatoroofing"
    let domainName = parts[0];
    if (domainName.length < 3 && parts.length > 2) {
      domainName = parts.slice(0, -1).join("-");
    }
    
    const base = domainName
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
      
    return base || "site";
  } catch {
    return url
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "site";
  }
}

/** Compares websites by hostname so protocol, www, query strings, and hashes do not create duplicates. */
export function normaliseWebsiteHost(url: string): string | null {
  try {
    const value = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function generateUniqueDomainSlug(
  admin: SupabaseClient,
  url: string
): Promise<string> {
  const base = cleanDomainSlug(url);
  
  // Check if base slug is available
  const { data: existing } = await admin
    .from("leads")
    .select("slug")
    .eq("slug", base)
    .maybeSingle();

  if (!existing) {
    return base;
  }

  // If duplicate, append clean counter e.g. "beqyzifar-2"
  for (let i = 2; i <= 50; i++) {
    const candidate = `${base}-${i}`;
    const { data: dup } = await admin
      .from("leads")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (!dup) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString(36).slice(-4)}`;
}
