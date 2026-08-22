"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CloudDownload,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  Globe2,
  Image as ImageIcon,
  Layers,
  Loader2,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Lead, Artifact } from "@/types/database";

interface AssetSlottingManagerProps {
  lead: Lead;
  artifact: Artifact;
}

export function AssetSlottingManager({ lead, artifact }: AssetSlottingManagerProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archivedMsg, setArchivedMsg] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Asset slot state - only real extracted assets, zero fake fallbacks
  const extracted = (artifact.extracted_assets as any) || {};
  const [heroCutout, setHeroCutout] = useState<string>(extracted?.hero_cutout || "");
  const [logoUrl, setLogoUrl] = useState<string>(extracted?.branding?.logo || "");
  const [serviceImages, setServiceImages] = useState<{ [key: string]: string }>({
    "service-1": "",
    "service-2": "",
    "service-3": "",
    "service-4": "",
    "service-5": "",
    "service-6": "",
  });

  const services = artifact.funnel_pages.filter((s) => s.kind === "service");
  const businessName = lead.business_name || lead.contact_name || lead.source_url;
  const phone = lead.phone || "No phone on file";

  async function handleFileUpload(slot: string, file: File) {
    setUploadingSlot(slot);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lead_id", lead.id);
      formData.append("slot_hint", slot);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        if (slot === "hero_cutout") setHeroCutout(data.url);
        else if (slot === "logo") setLogoUrl(data.url);
        else {
          setServiceImages((prev) => ({ ...prev, [slot]: data.url }));
        }
      } else {
        const objectUrl = URL.createObjectURL(file);
        if (slot === "hero_cutout") setHeroCutout(objectUrl);
        else if (slot === "logo") setLogoUrl(objectUrl);
        else setServiceImages((prev) => ({ ...prev, [slot]: objectUrl }));
      }
    } catch {
      const objectUrl = URL.createObjectURL(file);
      if (slot === "hero_cutout") setHeroCutout(objectUrl);
      else if (slot === "logo") setLogoUrl(objectUrl);
      else setServiceImages((prev) => ({ ...prev, [slot]: objectUrl }));
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleArchiveRemoteAssets() {
    setArchiving(true);
    setArchivedMsg(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/assets/archive`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setArchivedMsg(`✓ Successfully migrated & optimized ${data.migratedCount} remote image assets into permanent Supabase Storage!`);
        router.refresh();
      } else {
        alert("Failed to archive remote assets.");
      }
    } catch {
      alert("Error archiving remote assets.");
    } finally {
      setArchiving(false);
    }
  }

  function handleExportZip() {
    setExporting(true);
    window.location.href = `/api/leads/${lead.id}/export`;
    setTimeout(() => setExporting(false), 2500);
  }

  return (
    <Card className="border-border shadow-sm overflow-hidden bg-white">
      <CardContent className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">
                Media Asset Slotting & Standalone Export
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload custom owner headshots, logos, and service photos to Supabase Storage, or export standalone Next.js code.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              onClick={handleArchiveRemoteAssets}
              disabled={archiving}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold border-primary text-primary hover:bg-primary/10"
            >
              <CloudDownload className="h-4 w-4" />
              {archiving ? "Archiving..." : "Migrate Hotlinks to Supabase Storage"}
            </Button>

            <Button
              onClick={handleExportZip}
              disabled={exporting}
              size="sm"
              className="gap-2 font-bold bg-[#07284d] text-white hover:bg-[#0c68c8]"
            >
              <Download className="h-4 w-4 text-[#ffd12d]" />
              {exporting ? "Compiling Zip..." : "Export Next.js Project (.zip)"}
            </Button>
          </div>
        </div>

        {archivedMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700">
            {archivedMsg}
          </div>
        )}

        {/* ASSET SLOTTING CONTROLS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Slot: Hero Owner Cutout */}
          <div className="rounded-xl border border-border bg-[#f9f9ff] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-foreground">Hero Owner Cutout</span>
              <span className="text-[10px] rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                Slot: Hero
              </span>
            </div>
            <div className="relative aspect-[16/10] rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center p-2">
              {heroCutout ? (
                <img src={heroCutout} alt="Hero Cutout" className="h-full w-auto object-contain" />
              ) : (
                <span className="text-[11px] text-slate-400">No Custom Cutout (Using Scraped Brand)</span>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-cutout" className="text-[11px] font-semibold cursor-pointer">
                {uploadingSlot === "hero_cutout" ? "Uploading to Supabase..." : "Upload Cutout PNG"}
              </Label>
              <input
                id="upload-cutout"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload("hero_cutout", f);
                }}
                className="block w-full text-[11px] text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:opacity-90"
              />
            </div>
          </div>

          {/* Slot: Brand Logo Vector */}
          <div className="rounded-xl border border-border bg-[#f9f9ff] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-foreground">Brand Logo / Vector</span>
              <span className="text-[10px] rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                Slot: Logo
              </span>
            </div>
            <div className="relative aspect-[16/10] rounded-lg bg-white overflow-hidden flex items-center justify-center p-4 border border-border">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-12 w-auto object-contain" />
              ) : (
                <span className="text-[11px] text-muted-foreground">Scraped Logo Active</span>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-logo" className="text-[11px] font-semibold cursor-pointer">
                {uploadingSlot === "logo" ? "Uploading to Supabase..." : "Upload Logo Vector (SVG/PNG)"}
              </Label>
              <input
                id="upload-logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload("logo", f);
                }}
                className="block w-full text-[11px] text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:opacity-90"
              />
            </div>
          </div>

          {/* Slot: 6 Core Services Route Visuals */}
          <div className="rounded-xl border border-border bg-[#f9f9ff] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-foreground">Service Route Visuals</span>
              <span className="text-[10px] rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600">
                {services.length} Routes Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 aspect-[16/10]">
              {services.slice(0, 6).map((s, i) => (
                <div key={i} className="relative rounded overflow-hidden bg-slate-200 border border-border flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[#07284d] truncate px-1">#{i + 1} {s.h2.slice(0, 10)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-service" className="text-[11px] font-semibold cursor-pointer">
                Upload Service Card Photo
              </Label>
              <input
                id="upload-service"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload("service-1", f);
                }}
                className="block w-full text-[11px] text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:opacity-90"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
