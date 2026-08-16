"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import landing from "../../../content/landing.json";

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-2xl px-6 py-24 text-center">
      <SectionEyebrow icon={HelpCircle}>Questions</SectionEyebrow>
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Anything holding you back?</h2>
      <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card text-left shadow-card">
        {landing.faq.map((item, i) => (
          <Collapsible key={item.question} open={openIndex === i} onOpenChange={(open) => setOpenIndex(open ? i : null)}>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium">
              {item.question}
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", openIndex === i && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">{item.answer}</CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </section>
  );
}
