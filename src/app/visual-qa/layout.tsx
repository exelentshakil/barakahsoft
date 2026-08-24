import type { ReactNode } from "react";
import "@/app/bespoke.css";

export const metadata = { robots: { index: false, follow: false } };

export default function VisualQaLayout({ children }: { children: ReactNode }) {
  return children;
}
