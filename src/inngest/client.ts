import { Inngest } from "inngest";

// Explicit isDev rather than relying on the SDK's own auto-detection —
// observed sending straight to Inngest Cloud (401, no event key) under
// plain `next dev` otherwise. `npx inngest-cli dev -u http://localhost:3000/api/inngest`
// must be running locally for events to actually execute.
export const inngest = new Inngest({
  id: "barakahsoft",
  isDev: process.env.NODE_ENV !== "production",
});
