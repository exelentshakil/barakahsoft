export const LEAD_PROBLEMS = [
  "Not enough leads or enquiries",
  "Nobody finds us on Google",
  "Invisible in AI search",
  "Outdated design / looks wrong on phones",
  "Visitors don't convert into calls",
  "Other issue — we'll check for you",
] as const;

export type LeadProblem = (typeof LEAD_PROBLEMS)[number];

export function isLeadProblem(value: unknown): value is LeadProblem {
  return typeof value === "string" && LEAD_PROBLEMS.includes(value as LeadProblem);
}
