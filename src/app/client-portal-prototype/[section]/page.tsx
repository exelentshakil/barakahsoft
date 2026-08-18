import { notFound } from "next/navigation";
import { CrispChat } from "@/components/CrispChat";
import { ClientPortalSection } from "@/components/client/ClientPortalSection";

const SECTIONS = ["leads", "reports", "website", "account"] as const;

export default async function ClientPortalSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SECTIONS.includes(section as (typeof SECTIONS)[number])) notFound();
  return <><ClientPortalSection section={section as (typeof SECTIONS)[number]} /><CrispChat /></>;
}
