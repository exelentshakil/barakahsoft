import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BespokeHomepage } from "@/components/site-shell/BespokeHomepage";
import { QuoteModalProvider } from "@/components/site-shell/QuoteModalProvider";
import { getSiteData } from "@/lib/get-site-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVisualQaWorker } from "@/lib/visual-qa-worker-auth";
import type { GenerationCandidate } from "@/lib/visual-qa";
import type { Lead } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CandidatePreviewPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  if (!isVisualQaWorker(await headers())) notFound();

  const { candidateId } = await params;
  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("generation_candidates")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle<GenerationCandidate>();
  if (!candidate) notFound();

  const { data: lead } = await admin
    .from("leads")
    .select("*")
    .eq("id", candidate.lead_id)
    .maybeSingle<Lead>();
  if (!lead) notFound();

  const site = await getSiteData(lead.slug);
  if (!site) notFound();

  const payload = {
    ...site.payload,
    bespokeHomepageHtml: candidate.html,
    bespokeCss: candidate.css,
    bespokeChromeHtml: null,
    bespokeFooterHtml: null,
  };

  return (
    <QuoteModalProvider payload={payload}>
      {payload.designTokens?.fontHref && (
        <link rel="stylesheet" href={payload.designTokens.fontHref} precedence="default" />
      )}
      <BespokeHomepage payload={payload} />
    </QuoteModalProvider>
  );
}
