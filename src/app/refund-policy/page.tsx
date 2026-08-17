import type { Metadata } from "next";
import { MarketingLegalPage } from "@/components/landing/MarketingLegalPage";

export const metadata: Metadata = { title: "Refund Policy | BarakahSoft", description: "Refund and lead-target policy for BarakahSoft services." };
export default function RefundPage() { return <MarketingLegalPage kind="refund" />; }
