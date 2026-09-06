"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// One upload widget for anything an operator manually attaches to a lead
// (QA touch-ups, prompt-editor image swaps) — not rebuilt per surface.
export function ImageUpload({
  value,
  onChange,
  leadId,
  slotHint,
  shape = "wide",
}: {
  value?: string;
  onChange: (url: string) => void;
  leadId: string;
  slotHint?: string;
  shape?: "wide" | "square";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lead_id", leadId);
    if (slotHint) formData.append("slot_hint", slotHint);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    onChange(data.url);
  }

  const openPicker = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const removeImage = () => {
    if (uploading) return;
    onChange("");
  };

  const handlePrimaryKeyDown = (event: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const handleRemoveKeyDown = (event: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      removeImage();
    }
  };

  const previewClass = shape === "square" ? "h-20 w-20 rounded-lg object-cover" : "h-24 w-full max-w-xs rounded-lg object-cover";
  const emptyClass = shape === "square" ? "h-20 w-20" : "h-24 w-full max-w-xs";

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="relative inline-block" tabIndex={0} onKeyDown={handleRemoveKeyDown} aria-label="Image preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={previewClass} />
          <button
            type="button"
            onClick={removeImage}
            onKeyDown={handleRemoveKeyDown}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onKeyDown={handlePrimaryKeyDown}
          disabled={uploading}
          className={cn("flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-input text-xs text-muted-foreground hover:bg-accent disabled:opacity-60", emptyClass)}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload image"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {value && (
        <button type="button" onClick={openPicker} onKeyDown={handlePrimaryKeyDown} disabled={uploading} className="block text-xs text-primary hover:underline">
          {uploading ? "Uploading..." : "Replace image"}
        </button>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
      <p className="text-[10px] text-muted-foreground">PNG, JPEG, WebP, GIF, or SVG — 8MB max</p>
    </div>
  );
}
