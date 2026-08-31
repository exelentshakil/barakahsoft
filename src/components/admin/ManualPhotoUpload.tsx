"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LeadPhoto {
  url: string;
  caption?: string;
}

export function ManualPhotoUpload({
  leadId,
  photos = [],
  onUploadComplete,
}: {
  leadId: string;
  /** The lead's current photo library, so the operator can see and prune it. */
  photos?: LeadPhoto[];
  onUploadComplete?: () => void;
}) {
  const [library, setLibrary] = useState<LeadPhoto[]>(photos);
  const [removing, setRemoving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append("file", files[i]);
    }

    try {
      const res = await fetch(`/api/leads/${leadId}/assets/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      const skippedNote = Array.isArray(data.skipped) && data.skipped.length > 0
        ? ` ${data.skipped.length} skipped: ${(data.skipped as { name: string; reason: string }[])
            .map((item) => `${item.name} — ${item.reason}`)
            .join(" ")}`
        : "";
      setSuccessMsg(`Processed ${data.uploaded} image(s) — ${data.usable} judged usable.${skippedNote}`);
      if (Array.isArray(data.photos)) setLibrary((prev) => [...prev, ...(data.photos as LeadPhoto[])]);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleRemove(url: string) {
    setRemoving(url);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/assets/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove that photo");
      setLibrary((prev) => prev.filter((photo) => photo.url !== url));
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that photo");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Card className="border border-[#e5e7f2] bg-white shadow-sm mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#0d1738]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
              <UploadCloud className="h-4 w-4" />
            </span>
            Add Original Photography
          </h3>
          <p className="text-xs text-[#42506a] max-w-2xl">
            Upload client photos from their gallery or portfolio before generating the site.
            The AI will caption them, judge their quality, and place them automatically
            during generation to make the site look premium and real.
            JPEG, PNG, WebP or AVIF, at least 400px on the shortest edge. HEIC from an iPhone
            will not work — export as JPEG first.
          </p>
        </div>

        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700">{error}</p>}
        {successMsg && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{successMsg}</p>}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          ref={fileInput}
          onChange={handleUpload}
        />

        <Button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="gap-2 bg-[#0d1738] text-white hover:bg-[#1b2a5c] text-xs font-bold"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          {uploading ? "Uploading & analysing..." : "Select Photos"}
        </Button>

        {library.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#42506a]">
              {library.length} photo{library.length === 1 ? "" : "s"} in this lead&apos;s library
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {library.map((photo) => (
                <div key={photo.url} className="group relative overflow-hidden rounded-lg border border-[#e5e7f2] bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption || "Client photo"} className="aspect-square w-full object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => handleRemove(photo.url)}
                    disabled={removing === photo.url}
                    title="Remove from this lead"
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-rose-600 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100 disabled:opacity-60"
                  >
                    {removing === photo.url ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-[#42506a]">
              Removing takes a photo out of future builds. Pages already delivered keep working.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
