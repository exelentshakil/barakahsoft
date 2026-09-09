// v4 Phase P4 — shared BreadcrumbList builder so every inner page emits the
// same real per-lead JSON-LD shape the homepage's LocalBusiness/FAQPage
// schema already uses, instead of each page hand-rolling it.
export function breadcrumbSchema(leadSlug: string, businessName: string, trail: { name: string; path: string }[]) {
  const items = [{ name: businessName, path: "" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `/s/${leadSlug}${item.path}`,
    })),
  };
}

// Service schema for a service-detail or location-service page — real
// per-lead data only (business name, service name, phone/address when
// present), same grounding discipline as every other JSON-LD block here.
export function serviceSchema(opts: {
  serviceName: string;
  businessName: string;
  phone: string | null;
  address: string | null;
  areaName?: string;
  /** From the vertical profile. A menu item is not a Service. */
  offeringType?: "Service" | "Product" | "MenuItem" | "Course" | "Event";
  /** From the vertical profile, so the provider is typed as what it is. */
  providerType?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": opts.offeringType ?? "Service",
    serviceType: opts.serviceName,
    provider: {
      "@type": opts.providerType ?? "LocalBusiness",
      name: opts.businessName,
      telephone: opts.phone ?? undefined,
      address: opts.address ?? undefined,
    },
    areaServed: opts.areaName ?? undefined,
  };
}
