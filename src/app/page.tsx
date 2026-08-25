import { LeadEngineLanding } from "@/components/landing/LeadEngineLanding";
import { CookieConsent } from "@/components/landing/CookieConsent";

// The Design Quality Bar reads approved showcases from the database, so a
// fully static page would freeze whatever was approved at build time and
// never show another one. The approve endpoint also revalidates this path
// directly, making that the fast path and this the safety net.
export const revalidate = 300;

export default function LandingPage() {
  return (
    <>
      <LeadEngineLanding />
      <CookieConsent />
    </>
  );
}
