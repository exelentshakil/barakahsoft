import type { Metadata } from "next";
import { MarketingLegalPage } from "@/components/landing/MarketingLegalPage";

export const metadata: Metadata = { title: "Privacy Policy | BarakahSoft", description: "BarakahSoft privacy policy." };
export default function PrivacyPage() { return <MarketingLegalPage kind="privacy" />; }
