import { createAdminClient } from "@/lib/supabase/admin";
import { readUnsubscribeToken } from "@/lib/outreach/unsubscribe-token";

// One click, and it is over.
//
// This is the highest-leverage route in the outreach path. What damages a
// sending domain is not volume, it is the spam button — and someone who has an
// obvious way out does not press it. So: no login, no confirmation step, no
// "tell us why", no preference centre. One request, and they are never emailed
// again.
//
// POST exists for RFC 8058 one-click unsubscribe, which is what Gmail and Yahoo
// call when they render their own List-Unsubscribe button. GET is the same
// thing for a person who clicked the link in the message.
export const dynamic = "force-dynamic";

async function stop(token: string | null): Promise<boolean> {
  const leadId = readUnsubscribeToken(token);
  if (!leadId) return false;

  const admin = createAdminClient();
  // Idempotent on purpose: a mail client that calls this twice, or a person who
  // clicks an old message after already opting out, must not see an error.
  await admin
    .from("leads")
    .update({ outreach_stopped_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("outreach_stopped_at", null);
  return true;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const ok = await stop(url.searchParams.get("t"));
  return new Response(ok ? "Unsubscribed" : "Invalid link", { status: ok ? 200 : 400 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ok = await stop(url.searchParams.get("t"));

  const body = ok
    ? `<h1>Done — you won't hear from us again.</h1>
       <p>That address has been removed. Nothing further will be sent, and there is nothing else for you to do.</p>
       <p>Sorry for the interruption.</p>`
    : `<h1>That link isn't valid</h1>
       <p>It may have been altered in transit. Reply to the email with the word STOP and it will be handled by hand.</p>`;

  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${ok ? "Unsubscribed" : "Invalid link"}</title>
<style>
:root{color-scheme:light}
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#fff;color:#0F1115;
     font:16px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;padding:24px}
main{max-width:32rem}
h1{font-size:1.4rem;line-height:1.25;margin:0 0 .75rem}
p{color:#3D4350;margin:0 0 .75rem}
</style></head><body><main>${body}</main></body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } }
  );
}
