import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkHeroVideoOperation, startVideoGeneration, storeGeneratedVideo } from "@/lib/google/veo";
import { SocialContentSchema } from "@/lib/social-content";

async function updateMotion(leadId: string, patch: Record<string, unknown>) {
  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("extracted_assets")
    .eq("lead_id", leadId)
    .single();
  const extracted = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;
  const mockup = (extracted.mockup ?? {}) as Record<string, unknown>;
  const current = (mockup.socialMotion ?? {}) as Record<string, unknown>;
  const { error } = await admin
    .from("artifacts")
    .update({
      extracted_assets: { ...extracted, mockup: { ...mockup, socialMotion: { ...current, ...patch } } },
      last_edited_at: new Date().toISOString(),
    })
    .eq("lead_id", leadId);
  if (error) throw error;
}

export const socialMotionGenerate = inngest.createFunction(
  {
    id: "social-motion-generate",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const leadId = (event?.data?.event?.data as { lead_id?: string } | undefined)?.lead_id;
      if (leadId) await updateMotion(leadId, { status: "failed", error: String(error?.message ?? error).slice(0, 500) });
    },
  },
  { event: "social-motion/generate.requested" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();
    const content = await step.run("load-social-direction", async () => {
      const { data: artifact } = await admin
        .from("artifacts")
        .select("extracted_assets")
        .eq("lead_id", lead_id)
        .single();
      const extracted = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;
      const mockup = (extracted.mockup ?? {}) as Record<string, unknown>;
      const parsed = SocialContentSchema.safeParse(mockup.socialContent);
      if (!parsed.success) throw new Error("Generate and review the social content kit before creating a motion video.");
      await updateMotion(lead_id, { status: "starting", error: null, requestedAt: new Date().toISOString() });
      return parsed.data;
    });

    const operation = await step.run("start-veo-social-video", async () => {
      const prompt = `${content.motion.veoPrompt}\n\nSpoken voiceover, verbatim: "${content.motion.voiceover}"\nVertical premium social film, 9:16, eight seconds, native synchronized speech and restrained sound design.`;
      const result = await startVideoGeneration(prompt, "9:16");
      if (!result.operationName) throw new Error(`Veo could not start (${result.reason ?? "unknown"}).`);
      await updateMotion(lead_id, { status: "generating", operationName: result.operationName });
      return result.operationName;
    });

    let videoUri: string | null = null;
    for (let attempt = 1; attempt <= 36 && !videoUri; attempt++) {
      await step.sleep(`wait-for-veo-${attempt}`, "10s");
      const poll = await step.run(`poll-veo-${attempt}`, () => checkHeroVideoOperation(operation));
      if (poll.done && !poll.videoUri) throw new Error(`Veo generation failed (${poll.reason ?? "unknown"}).`);
      videoUri = poll.videoUri;
    }
    if (!videoUri) throw new Error("Veo generation timed out after six minutes.");

    const stored = await step.run("store-social-video", () =>
      storeGeneratedVideo(lead_id, videoUri!, "social-motion-9x16", "social-motion")
    );
    if (!stored.publicUrl) throw new Error(`Could not store generated video (${stored.reason ?? "unknown"}).`);

    await step.run("publish-social-video", () =>
      updateMotion(lead_id, {
        status: "complete",
        videoUrl: stored.publicUrl,
        completedAt: new Date().toISOString(),
        voiceover: content.motion.voiceover,
      })
    );
    return { lead_id, videoUrl: stored.publicUrl };
  }
);
