import { z } from "zod";

export const VisualFindingSchema = z.object({
  check: z.string().min(1).max(80),
  severity: z.enum(["blocker", "warning"]),
  detail: z.string().min(1).max(500),
  viewport: z.enum(["desktop", "tablet", "mobile", "all"]).optional(),
});

export const VisualScorecardSchema = z.object({
  firstScreen: z.number().min(0).max(10),
  hierarchy: z.number().min(0).max(10),
  balance: z.number().min(0).max(10),
  typography: z.number().min(0).max(10),
  imagery: z.number().min(0).max(10),
  cohesion: z.number().min(0).max(10),
  mobile: z.number().min(0).max(10),
  nicheFit: z.number().min(0).max(10),
});

export const VisualCritiqueSchema = z.object({
  passes: z.boolean(),
  score: z.number().min(0).max(100),
  scores: VisualScorecardSchema,
  blockers: z.array(z.string().min(1).max(500)).max(12),
  warnings: z.array(z.string().min(1).max(500)).max(12),
  strengths: z.array(z.string().min(1).max(500)).max(8),
  summary: z.string().min(1).max(1000),
});

export const VisualQaReportSchema = z.object({
  passes: z.boolean(),
  capturedAt: z.string().datetime(),
  workerId: z.string().min(1).max(120),
  error: z.string().min(1).max(1000).optional(),
  deterministic: z.object({
    passes: z.boolean(),
    findings: z.array(VisualFindingSchema).max(100),
    pageErrors: z.array(z.string().max(500)).max(30),
    consoleErrors: z.array(z.string().max(500)).max(30),
    failedRequests: z.array(z.string().max(1000)).max(30),
  }),
  critique: VisualCritiqueSchema.nullable(),
}).superRefine((report, context) => {
  if (!report.passes) return;
  const validPass =
    !report.error &&
    report.deterministic.passes &&
    report.critique?.passes === true &&
    report.critique.score >= 82 &&
    report.critique.blockers.length === 0 &&
    !report.deterministic.findings.some((finding) => finding.severity === "blocker");
  if (!validPass) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["passes"],
      message: "A passing report requires clean deterministic checks and a visual critique score of at least 82.",
    });
  }
});

export type VisualFinding = z.infer<typeof VisualFindingSchema>;
export type VisualCritique = z.infer<typeof VisualCritiqueSchema>;
export type VisualQaReport = z.infer<typeof VisualQaReportSchema>;

export type VisualQaStatus = "queued" | "running" | "passed" | "failed" | "error" | "timed_out";

export interface GenerationCandidate {
  id: string;
  lead_id: string;
  attempt: number;
  html: string;
  css: string;
  rationale: string | null;
  context: Record<string, unknown>;
  source_report: unknown | null;
  creative_report: unknown | null;
  visual_status: VisualQaStatus;
  visual_report: VisualQaReport | null;
  desktop_screenshot_path: string | null;
  tablet_screenshot_path: string | null;
  mobile_screenshot_path: string | null;
  worker_id: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function visualQaEnabled(): boolean {
  return process.env.VISUAL_QA_ENABLED === "true";
}

export function visualReportPasses(report: VisualQaReport): boolean {
  return Boolean(
    !report.error &&
      report.deterministic.passes &&
      report.critique?.passes &&
      report.critique.score >= 82 &&
      report.critique.blockers.length === 0 &&
      !report.deterministic.findings.some((finding) => finding.severity === "blocker")
  );
}
