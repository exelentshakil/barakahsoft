"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Realtime subscriptions that are actually authenticated.
//
// With cookie-based SSR sessions the browser client has no session in memory
// at construction time — it reads cookies lazily. The Realtime socket,
// however, connects immediately, so it opens as `anon` and every RLS policy
// that requires an operator correctly rejects it. The subscription then
// reports SUBSCRIBED and silently delivers nothing, which is indistinguishable
// from "nothing is happening".
//
// Loading the session first and handing the access token to Realtime before
// subscribing is what makes the socket carry the operator's identity. Without
// this the RLS policies added for the admin workspace have no effect at all.

export async function subscribeAsOperator(
  build: (client: SupabaseClient) => RealtimeChannel
): Promise<{ client: SupabaseClient; channel: RealtimeChannel } | null> {
  const client = createClient();

  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.access_token) {
    // Not signed in. Subscribing anyway would connect as anon and receive
    // nothing, so it is better to do nothing and let the page render.
    return null;
  }

  await client.realtime.setAuth(session.access_token);

  const channel = build(client);
  channel.subscribe((status) => {
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error(`[realtime] channel ${status} — live updates are not running`);
    }
  });

  return { client, channel };
}
