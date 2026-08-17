"use client";

import { useState } from "react";

export function DesignReferenceCard({ url, alt }: { url: string; alt: string }) {
  const [available, setAvailable] = useState(true);
  if (!available) return null;

  return (
    <div className="h-48 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {/* Reference assets can be removed from Storage after this page is cached. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-full w-full object-cover object-top" onError={() => setAvailable(false)} />
    </div>
  );
}
