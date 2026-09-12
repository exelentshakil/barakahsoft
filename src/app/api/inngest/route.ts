import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { scrapeRun } from "@/inngest/functions/scrape-run";
import { deliverSend } from "@/inngest/functions/deliver-send";
import { goLive } from "@/inngest/functions/go-live";
import { syncAdSpend } from "@/inngest/functions/sync-ad-spend";
import { revalidateHotlinks } from "@/inngest/functions/revalidate-hotlinks";
import { rescrapeLead } from "@/inngest/functions/rescrape";
import { measureVisibility } from "@/inngest/functions/measure-visibility";
import { socialMotionGenerate } from "@/inngest/functions/social-motion";

// Each Inngest step executes as its own invocation of THIS route, and 300
// seconds is the ceiling the platform enforces on one invocation.
//
// It is not raised here on purpose. The bespoke build takes about eight
// minutes end to end, and it ran as a single step until it started returning
// 504s with no explanation — the platform killed the invocation before the
// SDK could answer. Raising this would only move the wall; the build is split
// into per-stage steps instead (art direction, stylesheet, batches of four
// sections, chrome, critique, repairs), and every model call it makes is
// given a request timeout below this number so a slow model fails as a
// readable error rather than as a platform timeout.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeRun, socialMotionGenerate, rescrapeLead, measureVisibility, deliverSend, goLive, revalidateHotlinks, syncAdSpend],
});
