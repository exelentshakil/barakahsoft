"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ManualPhotoUpload({ leadId, onUploadComplete }: { leadId: string, onUploadComplete?: () => void }) {
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
      
      setSuccessMsg(`Successfully processed ${data.uploaded} images (${data.usable} deemed usable by AI).`);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
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
          </p>
        </div>

        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700">{error}</p>}
        {successMsg && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{successMsg}</p>}

        <input
          type="file"
          accept="image/*"
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
          {uploading ? "Uploading & Analyzing..." : "Select Photos"}
        </Button>
      </CardContent>
    </Card>
  );
}
