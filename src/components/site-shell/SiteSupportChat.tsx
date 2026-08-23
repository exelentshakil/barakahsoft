"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CrispChat } from "@/components/CrispChat";

// The support chat, kept out of the preview.
//
// ?view=preview is what the admin workspace loads inside its inspector
// iframe, so the chat bubble was rendering on top of the client's own
// homepage every time an operator reviewed a build — floating over the
// bottom-right corner of the thing being judged, in every screenshot taken
// of it.
//
// The gate is client-side because a Next layout never receives searchParams,
// and this is mounted from the /s/[leadSlug] layout so one modal and one
// chat instance are shared across every page of a delivered site.
function ChatGate() {
  const params = useSearchParams();
  if (params.get("view") === "preview") return null;
  return <CrispChat />;
}

export function SiteSupportChat() {
  // useSearchParams needs a Suspense boundary to avoid opting the whole
  // route into client-side rendering.
  return (
    <Suspense fallback={null}>
      <ChatGate />
    </Suspense>
  );
}
