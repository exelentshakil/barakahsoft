import type { Metadata } from "next";
import { MarketingLegalPage } from "@/components/landing/MarketingLegalPage";

export const metadata: Metadata = { title: "Terms and Conditions | BarakahSoft", description: "Terms for BarakahSoft managed lead-generation services." };
export default function TermsPage() { return <MarketingLegalPage kind="terms" />; }
