# Clip Engine

Personal pipeline for finding, ranking, and (later) clipping Whop Content Rewards campaigns. This repository is self-contained: use a dedicated Supabase project, GitHub repo, Vercel project, Google Cloud project, and social/developer apps. Do not reuse another product's database, cloud project, domain, or secrets.

Phase 0 ships the data model and **Campaign Scout**. Nothing posts to social platforms in this phase.

The discover feed the scout reads is an **internal, undocumented** Whop endpoint. It needs a signed-in session cookie, can change without notice, and **Whop's terms must be checked before heavy automation**. Poll about once an hour with a 400 ms pause between pages.

## What's here

- `docs/phase-0-spec.md` — setup, data model, scoring, filters, alerts, exit test
- `supabase/migrations/0001_init.sql` — Postgres schema
- `supabase/migrations/0002_cron.sql` — optional pg_cron + pg_net invoke (placeholders)
- `supabase/config.toml` — scheduled Edge Functions (`scout-fetch` hourly, `scout-briefs` at :15)
- `supabase/functions/scout-fetch` — crawl, upsert, snapshot, score, filter, tag, alert
- `supabase/functions/scout-briefs` — fetch rules text for candidates
- `supabase/functions/_shared` — scoring, filters, tagging, Whop client (unit-tested)
- `scripts/print-campaigns.ts` — Phase 0 exit test (live feed → printed rates and remaining budget)

## Prerequisites

- Deno (for local scripts and tests)
- Supabase CLI (to apply migrations and deploy functions)
- A Whop account signed in to the Content Rewards discover app at
  `https://b4e0vdqv6zgqeqj4pfgm.apps.whop.com/c/discover`

## Setup

1. Create a **new** Supabase project used only for Clip Engine.
2. Copy `.env.example` to `.env` and fill in values. Never commit `.env`.
3. Apply the schema:

   ```bash
   supabase db push
   # or run supabase/migrations/0001_init.sql in the SQL editor
   ```

4. From a browser session that can see the discover list, copy the request `Cookie` header into `WHOP_SESSION_COOKIE`.
5. Set the same values as function secrets:

   ```bash
   supabase secrets set --env-file .env
   ```

   Hosted functions already receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Set `CRON_SECRET` in production; both functions reject requests that lack it when it is set.
6. Deploy functions (`supabase functions deploy scout-fetch` and `scout-briefs`). Scheduled invocation is declared in `supabase/config.toml`. If your project uses pg_cron instead, edit the placeholders in `supabase/migrations/0002_cron.sql` and apply it.
7. Configure alerts (optional but recommended so new high-budget campaigns are noticed quickly):
   - **Resend email (default when `RESEND_API_KEY` is set):** `ALERT_CHANNEL=resend`, `RESEND_API_KEY`, `ALERT_FROM_EMAIL`, `ALERT_TO_EMAIL`. Override the API URL with `ALERT_WEBHOOK_URL` if needed.
   - **Generic webhook:** `ALERT_CHANNEL=webhook` and `ALERT_WEBHOOK_URL` (optional `ALERT_WEBHOOK_BEARER`). The body is JSON `{ type, generatedAt, campaigns }`.
   - **Off:** `ALERT_CHANNEL=none`.
   The first fetch (empty `campaigns` table) backfills silently so you are not emailed the entire marketplace.

## Phase 0 exit test

Print today's campaigns with rate per 1K views and remaining budget from the live feed (no database required):

```bash
deno run --allow-net --allow-env --env-file=.env scripts/print-campaigns.ts
```

Useful flags: `--candidates` (apply the scout filters) and `--json`.

## Local checks

```bash
deno task test
deno task check
```

## Scoring (summary)

```
remaining = (budgetCents - metrics.budgetSpentCents) / 100
baseScore = maxRatePer1K * remaining / sqrt(1 + creatorCount)
freshness = 0.25 + 0.75 * exp(-ageDays / 7)
score     = baseScore * freshness
```

Candidates are CPM-only, at least $1,000 remaining, no application required, and must pay on at least one `ENABLED_PLATFORMS` value. Rates over $20/1K and months-old listings with zero creators are flagged, not dropped. UGC vs clipping is tagged from name/description keywords. Brands: Clipworthy (entertainment / streamers / podcast / pop culture), Founder Minute (business / finance / personal brand), Hook on Repeat (music), Dub Daily (gaming).

## Brief fetch (TODO-verify)

The campaign detail URL is not confirmed. `scout-briefs` uses `WHOP_BRIEF_URL_TEMPLATE` (default `{host}/api/campaign/campaigns/{id}`). Capture the XHR from a real campaign page and set the template before trusting `rules_text`.

## Platform audits

Copy-paste text for Google OAuth verification, the YouTube API Services audit/quota form, and the TikTok Content Posting API review lives in `docs/audits/`. Hostable homepage, privacy, and terms pages are in `web/app/`.

## Isolation

Dedicated database, repo, hosting, cloud project, developer apps, and secrets. No shared credentials with any other system.
