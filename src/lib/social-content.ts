import { z } from "zod";

export const SocialContentSchema = z.object({
  captions: z.object({
    redesign_proposed: z.string().min(120).max(2200),
    concept_teaser: z.string().min(120).max(2200),
    transformation: z.string().min(120).max(2200),
    authority: z.string().min(120).max(2200),
    contrarian: z.string().min(120).max(2200),
  }),
  motion: z.object({
    title: z.string().min(5).max(120),
    creativeDirection: z.string().min(40).max(1000),
    voiceover: z.string().min(30).max(1200),
    editorBrief: z.string().min(100).max(6000),
    veoPrompt: z.string().min(80).max(3000),
  }),
  moodboard: z.object({
    artDirection: z.string().min(30).max(1200),
    typography: z.string().min(10).max(500),
    lighting: z.string().min(10).max(500),
    texture: z.string().min(10).max(500),
    palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(3).max(6),
  }),
});

export type SocialContent = z.infer<typeof SocialContentSchema> & {
  generatedAt?: string;
  model?: string;
};

export type SocialCaptionAngle = keyof SocialContent["captions"];
