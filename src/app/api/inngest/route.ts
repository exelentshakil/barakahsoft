import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { scrapeRun } from "@/inngest/functions/scrape-run";
import { enrichGenerate } from "@/inngest/functions/enrich-generate";
import { renderBuild } from "@/inngest/functions/render-build";
import { deliverSend } from "@/inngest/functions/deliver-send";
import { enrichExpand } from "@/inngest/functions/enrich-expand";
import { rebuildInnerPages } from "@/inngest/functions/rebuild-inner-pages";
import { goLive } from "@/inngest/functions/go-live";
import { revalidateHotlinks } from "@/inngest/functions/revalidate-hotlinks";
import { bespokeGenerate } from "@/inngest/functions/bespoke-generate";

// Bespoke generation steps are long: the homepage step alone is a large
// draft call plus a critique pass plus a revise pass. Each Inngest step
// executes as its own invocation of THIS route, so without an explicit
// ceiling the platform default would kill a generation mid-step and the
// run would look like an unexplained failure.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeRun, enrichGenerate, renderBuild, deliverSend, enrichExpand, rebuildInnerPages, goLive, revalidateHotlinks, bespokeGenerate],
});
