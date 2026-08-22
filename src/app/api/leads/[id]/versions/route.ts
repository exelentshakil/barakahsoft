import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";
import { listVersions, restoreVersion } from "@/lib/page-versions";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  return NextResponse.json({ versions: await listVersions(leadId) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pageKey = typeof body.pageKey === "string" ? body.pageKey : "";
  const version = Number(body.version);

  if (!pageKey || !Number.isFinite(version)) {
    return NextResponse.json({ error: "Provide a page and a version to restore" }, { status: 400 });
  }

  const ok = await restoreVersion(leadId, pageKey, version);
  if (!ok) return NextResponse.json({ error: "That version no longer exists" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
