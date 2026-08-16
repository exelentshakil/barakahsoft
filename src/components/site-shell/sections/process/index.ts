import { ProcessSteps } from "@/components/site-shell/sections/process/ProcessSteps";
import { ProcessTimeline } from "@/components/site-shell/sections/process/ProcessTimeline";
import { ProcessNumberedIndex } from "@/components/site-shell/sections/process/ProcessNumberedIndex";

export const processVariants = { steps: ProcessSteps, "timeline-premium": ProcessTimeline, "numbered-index-alt": ProcessNumberedIndex };
export const processDefaultVariant = "steps";
