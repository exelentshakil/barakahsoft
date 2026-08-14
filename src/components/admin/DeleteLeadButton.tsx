"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this lead? This can't be undone.")) return;
    setDeleting(true);
    await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <Button size="icon" variant="ghost" disabled={deleting} onClick={handleDelete} aria-label="Delete lead">
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}
