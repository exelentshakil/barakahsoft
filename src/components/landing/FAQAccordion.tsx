"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import landing from "../../../content/landing.json";

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-2xl px-6 py-20">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight">Questions</h2>
      <div className="mt-8 divide-y divide-border rounded-lg border border-border">
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
