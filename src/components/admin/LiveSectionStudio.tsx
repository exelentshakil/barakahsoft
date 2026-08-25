"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Wand2, Check, PenLine, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Section {
  id: string;
  kind: string;
  label: string;
  html: string;
  locked: boolean;
}

export function LiveSectionStudio({ leadId, isActive }: { leadId: string; isActive: boolean }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [css, setCss] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string>>({});

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/sections`);
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
        setCss(data.css || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadSections();
      const interval = setInterval(loadSections, 5000); // Polling for live updates during build
      return () => clearInterval(interval);
    }
  }, [isActive, leadId]);

  const handleRefine = async (sectionId: string) => {
    const instruction = instructions[sectionId] || "Make it better and more modern.";
    setRefiningId(sectionId);
    try {
      const res = await fetch(`/api/leads/${leadId}/sections/${sectionId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      if (res.ok) {
        const data = await res.json();
        setSections(sections.map((s) => (s.id === sectionId ? data.section : s)));
      }
    } finally {
      setRefiningId(null);
    }
  };

  if (!isActive) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0d1738]">
            <Code2 className="h-5 w-5 text-[#533afd]" />
            Live Section-by-Section Studio
          </h3>
          <p className="mt-1 text-sm text-[#42506a]">
            Watch sections stream in real-time. Edit, refine, or regenerate individual blocks instantly.
          </p>
        </div>
        <Button onClick={loadSections} variant="outline" disabled={loading} size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {sections.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-[#c7d0fb] bg-[#fbfaff] p-8 text-center text-[#777588]">
          No sections generated yet. Start a build above to watch them stream here.
        </div>
      )}

      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={section.id} className="overflow-hidden rounded-2xl border border-[#e5e7f2] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e5e7f2] bg-[#fbfbfd] px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                  {idx + 1}
                </span>
                <h4 className="font-bold text-[#0d1738] capitalize">{section.label}</h4>
                <span className="text-[10px] uppercase tracking-wider text-[#777588] px-2 py-0.5 rounded-full bg-slate-100 font-semibold">
                  #{section.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#e5e7f2]">
              {/* Preview */}
              <div className="lg:col-span-2 bg-[#f8f9fa] p-4 relative min-h-[300px]">
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <style>${css}</style>
                      </head>
                      <body class="bg-white">
                        ${section.html}
                      </body>
                    </html>
                  `}
                  className="w-full h-full min-h-[300px] rounded border border-slate-200 bg-white"
                />
              </div>

              {/* Controls */}
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#777588] flex items-center gap-2">
                    <PenLine className="h-3 w-3" />
                    Operator Instructions
                  </label>
                  <textarea
                    className="w-full h-24 rounded-lg border border-[#e5e7f2] p-3 text-sm focus:border-[#533afd] focus:outline-none focus:ring-1 focus:ring-[#533afd]"
                    placeholder="e.g. Make the headline punchier, swap the image for something industrial..."
                    value={instructions[section.id] || ""}
                    onChange={(e) => setInstructions({ ...instructions, [section.id]: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full gap-2 font-semibold bg-[#533afd] hover:bg-[#432bd9]"
                    onClick={() => handleRefine(section.id)}
                    disabled={refiningId === section.id}
                  >
                    {refiningId === section.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 text-[#ffd12d]" />
                    )}
                    {refiningId === section.id ? "Refining..." : "Prompt & Rebuild Section"}
                  </Button>
                </div>

                <div className="rounded-lg bg-[#f0f3ff] p-3 border border-[#c7d0fb]">
                  <p className="text-[11px] leading-relaxed text-[#42506a]">
                    <strong>Vision / Figma:</strong> You can also paste screenshots or Figma URLs in your prompt for the AI to match visually (Coming soon to this UI, supported via OpenCode CLI).
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
