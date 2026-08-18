import { notFound } from "next/navigation";
import { CrispChat } from "@/components/CrispChat";
import { AdminPrototypeSection } from "@/components/admin/AdminPrototypeSection";

const SECTIONS = ["leads", "reports", "communications", "domains", "settings"] as const;

export default async function AdminPrototypeSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SECTIONS.includes(section as (typeof SECTIONS)[number])) notFound();
  return <><AdminPrototypeSection section={section as (typeof SECTIONS)[number]} /><CrispChat /></>;
}
