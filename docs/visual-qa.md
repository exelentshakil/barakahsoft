# Local Visual QA

Generated homepage candidates can be rendered by a local Playwright worker before they replace the current homepage. Inngest sleeps durably while polling the persisted result, so no Chromium process runs on Vercel and no completion event can be lost.

## Production Setup

1. Apply `supabase/migrations/00000000000048_visual_qa.sql`.
2. Generate a machine credential with `openssl rand -hex 32`.
3. Add these variables to the deployed application:

```sh
VISUAL_QA_ENABLED=true
VISUAL_QA_WORKER_TOKEN=<generated credential>
VISUAL_QA_PREVIEW_ORIGIN=https://portal.barakahsoft.com
```

4. Add these variables to `.env.local` on the machine running Chromium:

```sh
VISUAL_QA_API_ORIGIN=https://portal.barakahsoft.com
VISUAL_QA_WORKER_TOKEN=<same generated credential>
GEMINI_API_KEY=<Gemini key>
```

5. Install Chromium once and start the worker:

```sh
npm run visual-qa:install
npm run visual-qa:worker
```

Keep `VISUAL_QA_ENABLED=false` until the migration, deployment and worker credential are ready. With the gate enabled, a missing worker times out after 15 minutes and preserves the previous homepage.

## One-Shot Check

To process one queued candidate and exit:

```sh
npm run visual-qa:once
```

## What Runs Locally

For 1440x900, 768x1024 and 390x844 viewports, the worker:

- waits for fonts and images;
- blocks tracking hosts;
- records page, console and request failures;
- detects broken images, horizontal overflow and viewport escapes;
- detects missing headings, clipped text and missing above-fold actions;
- checks mobile tap targets;
- runs Axe accessibility checks;
- captures first-screen and full-page screenshots;
- sends a compressed contact sheet and first screens to Gemini;
- uploads each compressed screenshot separately to stay below serverless request limits;
- stores evidence in the private `visual-qa` bucket.

Only a candidate passing source checks, the source-level creative review, deterministic browser checks and the rendered visual critic is promoted. Worker errors and timeouts fail closed.

## Local Application Mode

The same worker can test a local Next.js/Inngest stack:

```sh
VISUAL_QA_API_ORIGIN=http://localhost:3000
VISUAL_QA_PREVIEW_ORIGIN=http://localhost:3000
```

Run `npm run dev`, the Inngest development server, and `npm run visual-qa:worker` in separate terminals. The local database must include migration 48.
