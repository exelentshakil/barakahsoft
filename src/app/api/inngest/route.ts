import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { scrapeRun } from "@/inngest/functions/scrape-run";
import { enrichGenerate } from "@/inngest/functions/enrich-generate";
import { renderBuild } from "@/inngest/functions/render-build";
import { deliverSend } from "@/inngest/functions/deliver-send";
import { enrichExpand } from "@/inngest/functions/enrich-expand";
import { rebuildInnerPages } from "@/inngest/functions/rebuild-inner-pages";
import { goLive } from "@/inngest/functions/go-live";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeRun, enrichGenerate, renderBuild, deliverSend, enrichExpand, rebuildInnerPages, goLive],
});
