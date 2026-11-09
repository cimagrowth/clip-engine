# Clip Engine — Phase 0 Spec

Personal clipping pipeline for Whop Content Rewards. Isolated project: dedicated Supabase, GitHub (`clip-engine`), Vercel, Google Cloud, social apps, and secrets. Do not reuse infrastructure from any other product.

Phase 0 verifies setup and lands a working Campaign Scout so it can run as soon as the isolated Supabase project exists. Nothing posts publicly in this phase.

## 1. Setup steps

Complete these in a dedicated personal workspace before treating Phase 0 as done.

1. Create a new Supabase project used only for Clip Engine. Apply `supabase/migrations/0001_init.sql` (and optionally `0002_cron.sql` if you prefer pg_cron over scheduled Edge Functions).
2. Create the `clip-engine` GitHub repo and push this tree as the root.
3. Create a new Vercel project from that repo (review app comes in later phases). Use a default Vercel URL or a personal subdomain.
4. Create a separate AI workspace for this project.
5. Set every variable in `.env.example` as Supabase Edge Function secrets (`supabase secrets set ...`) and in a local `.env` that is never committed.
6. Confirm the Whop discover feed works while signed in: run `scripts/print-campaigns.ts` with `WHOP_SESSION_COOKIE` set. This is the Phase 0 exit test.
7. Deploy `scout-fetch` and `scout-briefs` and enable the hourly schedule (config.toml and/or pg_cron).
8. In parallel (not blocking the scout): create a new Google Cloud project under the personal Gmail used for this project and enable YouTube Data API v3; create a TikTok for Developers app requesting the Content Posting API.

Warm-up of social accounts continues independently. The scout does not post.

## 2. Hard rules that affect this phase

- No fake engagement, no identical reposts, no clipping material that a campaign did not provide or link.
- Humans approve which campaigns to join. The scout ranks and alerts; it does not auto-join.
- Credentials stay with the operator. The scout reads a session cookie from an environment variable that the operator pastes after signing in. The code never creates accounts, solves CAPTCHAs, or handles payment details.
- Follow each campaign's rules exactly. The scout stores rules text as soon as a candidate's brief can be fetched, so later review screens can show it beside every clip.
- The discover feed is an **internal, undocumented** endpoint. It can change or break without notice. Check Whop's terms before heavy automation. Poll about once an hour, with a 400 ms pause between pages.

## 3. How Whop Content Rewards works (for the scout)

Brands post campaigns. Clippers cut short clips from campaign-provided source material, post them on their own accounts, and submit the post URL. Most campaigns pay CPM (per 1,000 qualified views) until the budget is gone. Some are pool, per-post, or retainer. Many manually review submissions. Some require an application (`requiresApplication`). UGC campaigns (talking-head, split-screen, "film yourself") need a person on camera and are not clipping.

The live list is the Content Rewards app (`app_QRxsQodZgK1r4D`) hosted at:

`https://b4e0vdqv6zgqeqj4pfgm.apps.whop.com/c/discover`

launched via Whop's app launch URL. Public marketing URLs under `whop.com/discover/content-rewards/` and `whop.com/content-rewards/campaigns/` are dead ends.

### 3.1 Discover feed

Host: `https://b4e0vdqv6zgqeqj4pfgm.apps.whop.com`

```
GET /api/campaign/campaigns/discover?collapseGroups=true&limit=50&view=summary&sortBy=newest&cursor=<nextCursor>
```

Response shape:

```
{ data: CampaignSummary[], pagination: { count, cursor, limit, nextCursor, pageIndex, servingId }, success }
```

Paginate until `pagination.nextCursor` is null. A signed-in session cookie is required (`WHOP_SESSION_COOKIE`).

Other endpoints the page uses (not required for Phase 0 ranking, listed for later):

- `/api/campaign/campaigns/discover/hero`
- `/api/campaign/campaigns/discover/top-searched?range=7d` (also `24h`, `30d`)
- `/api/campaign/campaigns/discover/top-clips`
- discover with `row=trending&sortBy=trending` or `row=new&sortBy=newest`
- `/api/campaign/campaigns/discover/search/status`

Summary fields the scout persists: `id`, `name`, `description`, `status`, `payoutType`, `budgetCents`, `cpmMinRateCents`, `cpmMaxRateCents`, `primaryPayoutCents`, `payouts[]`, `platforms[]`, `categories[]`, `requiresApplication`, `private`, `retainerSpotsTotal`, timestamps (`createdAt`, `launchDate`, `listedAt`, `updatedAt`), organization fields, `briefCounts`, `referenceMaterials[]`, `metrics` (`budgetSpentCents`, `budgetProgressBps`, `totalViews`, `creatorCount`, `approvedSubmissionCount`, `paidOutCents`, `metricsUpdatedAt`), `featuredScore`, `banner`, `organizationLogoUrl`.

### 3.2 Full brief (rules)

The full campaign brief (content rules, creator requirements, references) lives on each campaign's own page. **TODO-verify:** the exact page URL and/or JSON endpoint were not confirmed when this spec was written. `WHOP_BRIEF_URL_TEMPLATE` is configurable and defaults to a best-guess API path. `scout-briefs` must fail softly, store the error, and never invent rules text.

There is no confirmed public API for clipper submissions. Later phases plan browser automation with human approval.

## 4. Data model

Refined from the architecture sketch. Postgres enums and checks live in `supabase/migrations/0001_init.sql`.

### 4.1 `campaigns`

One row per Whop campaign, upserted every fetch.

| Column | Purpose |
|---|---|
| `id` | Internal UUID |
| `whop_id` | Whop campaign id (unique) |
| `name`, `description`, `status` | Listing copy and Whop status |
| `payout_type` | `cpm` \| `pool` \| `per_post` \| `retainer` \| `unknown` (`perPost` maps to `per_post`; `unknown` is defensive for schema drift) |
| `budget_cents` | Total budget |
| `cpm_min_rate_cents`, `cpm_max_rate_cents`, `primary_payout_cents` | Headline rates (cents per 1K for CPM) |
| `payouts` | JSON array of per-platform `{ platform, rateCents, minPayoutCents, maxPayoutCents, payoutType }` |
| `platforms` | `tiktok`, `instagram`, `youtube`, `x`, `facebook`, … |
| `categories` | JSON array of `{ id, name }` |
| `requires_application`, `private`, `retainer_spots_total` | Access gates |
| `whop_created_at`, `launch_date`, `listed_at`, `whop_updated_at` | Whop timestamps |
| Organization fields | Name, id, verified, profile handle, experience id, logo |
| `brief_counts`, `reference_materials`, `featured_score`, `banner` | Summary extras |
| Latest metrics | `budget_spent_cents`, `budget_progress_bps`, `total_views`, `creator_count`, `approved_submission_count`, `paid_out_cents`, `metrics_updated_at` |
| Derived | `remaining_budget_cents`, `max_rate_per_1k` (dollars), `base_score`, `freshness_factor`, `score` |
| Tags | `content_kind` (`clipping` \| `ugc` \| `unknown`), `niches`, `brands` |
| Filters | `is_candidate`, `flag_rate_over_cap`, `flag_stale_zero_creators`, `exclusion_reasons` |
| Brief | `rules_text`, `brief_json`, `brief_fetched_at`, `brief_fetch_error` |
| Sightings | `first_seen_at`, `last_seen_at`, `last_scored_at`, `alerted_at` |
| `raw_summary` | Last summary JSON for debugging schema drift |

`first_seen_at` is set on insert and never overwritten. `last_seen_at` updates every fetch that includes the campaign.

### 4.2 `campaign_snapshots`

Append-only history for spend velocity and freshness of metrics.

| Column | Purpose |
|---|---|
| `campaign_id` | FK to `campaigns` |
| `captured_at` | Fetch time |
| `budget_cents`, `budget_spent_cents`, `remaining_cents` | Budget snapshot |
| `total_views`, `creator_count`, `approved_submission_count`, `paid_out_cents` | Activity |
| `base_score`, `freshness_factor`, `score` | Score as computed at capture |

### 4.3 `accounts`

Owned social accounts for the four brands. Unused by the scout in Phase 0; created now so later phases do not migrate again.

| Column | Purpose |
|---|---|
| `brand` | `clipworthy` \| `founder_minute` \| `hook_on_repeat` \| `dub_daily` |
| `platform` | `youtube` \| `tiktok` \| `instagram` \| `x` \| `facebook` |
| `handle` | Without a leading `@` by convention |
| `status` | `warming` \| `active` \| `paused` \| `banned` |
| `daily_cap` | Max posts per UTC day once publishing starts |
| `warmup_day` | Integer day in the warm-up schedule (1–5 no posts, 6–10 one hand post, 11+ up to the cap) |
| `email_plus_address`, `notes` | Optional operator metadata |

Unique on `(brand, platform, handle)`.

### 4.4 `sources`

Campaign-provided or campaign-linked videos only.

| Column | Purpose |
|---|---|
| `campaign_id` | FK |
| `url` | Original URL |
| `storage_path` | Object storage path once ingested |
| `duration_seconds` | Media length |
| `transcript` | Full transcript when available |
| `provenance` | How we know this URL belongs to the campaign (brief field, reference material, etc.) |

### 4.5 `clips`

Rendered candidates awaiting review.

| Column | Purpose |
|---|---|
| `source_id`, `campaign_id` | FKs |
| `start_seconds`, `end_seconds` | Source window |
| `hook`, `caption` | Per-clip copy (later: vary per account at post time) |
| `render_path` | Rendered 9:16 file |
| `status` | `draft` \| `approved` \| `rejected` |
| `checklist_result` | JSON from the rules compiler |

### 4.6 `posts`

A clip published to one account.

| Column | Purpose |
|---|---|
| `clip_id`, `account_id` | FKs |
| `platform_post_id`, `url` | Platform identifiers |
| `posted_at` | When it went live |
| `whop_submission_id`, `submission_status` | `pending` \| `submitted` \| `approved` \| `rejected` \| `paid` |

### 4.7 `metrics`

Point-in-time post stats (24 h, 72 h, 7 d, plus extras).

| Column | Purpose |
|---|---|
| `post_id` | FK |
| `captured_at` | Sample time |
| `views`, `likes` | Platform counts |
| `screenshot_path` | Dispute evidence |
| `est_earnings_cents` | Estimate from campaign rate × qualified views |

### 4.8 `scout_runs`

Operational log for fetch and brief jobs (pages fetched, counts, errors). Used to detect bootstrap runs so the first backfill does not email every listing.

## 5. Campaign Scout behavior

Two Edge Functions, both Deno, both using the service-role key server-side.

### 5.1 `scout-fetch` (hourly)

1. If `CRON_SECRET` is set, require it on the request (`Authorization: Bearer …` or `x-cron-secret`).
2. Insert a `scout_runs` row (`kind = fetch`).
3. Remember whether `campaigns` is empty (bootstrap).
4. `GET` the discover feed, `limit=50`, `view=summary`, `sortBy=newest`, `collapseGroups=true`. Follow `pagination.nextCursor` until it is null. Sleep **400 ms** between pages. Retry a failed page up to 3 times with backoff.
5. For each summary: normalize payout type, compute remaining budget, max rate / 1K, freshness, scores, filters, UGC/clipping tags, niche → brand mapping.
6. Upsert `campaigns` on `whop_id`. Preserve `first_seen_at`, `alerted_at`, and any previously stored brief fields unless this run fetched a newer brief.
7. Insert a `campaign_snapshots` row for every seen campaign.
8. Alerts (see §8): only after a non-bootstrap run, for campaigns that newly qualify as high-scoring candidates (`alerted_at` is null).
9. Finish the `scout_runs` row.

### 5.2 `scout-briefs` (hourly, offset :15)

1. Same auth gate as fetch.
2. Select candidates (`is_candidate = true`) whose brief is missing or older than `BRIEF_REFRESH_HOURS` (default 24), limited by `BRIEF_BATCH_SIZE` (default 25), highest score first.
3. For each, resolve `WHOP_BRIEF_URL_TEMPLATE` (see §11). Fetch with the same session cookie and 400 ms pacing.
4. **TODO-verify** the response shape. The worker tries JSON first (`contentRules`, `creatorRequirements`, `rules`, `brief`, nested `data`). If the body is HTML, it stores a trimmed text extract as `rules_text` and the raw payload marker in `brief_json`. On failure it records `brief_fetch_error` and leaves existing rules intact.
5. Never block `scout-fetch` if briefs fail.

### 5.3 What the scout does not do

Join campaigns, download sources, render clips, post, or submit to Whop.

## 6. Scoring

All money figures used in the formula are **dollars**. Cents from the API are divided by 100.

```
remaining = (budgetCents - metrics.budgetSpentCents) / 100
maxRatePer1K = max(
  cpmMaxRateCents / 100,
  cpmMinRateCents / 100,
  primaryPayoutCents / 100,
  each payouts[i].rateCents / 100
)
baseScore = maxRatePer1K * remaining / sqrt(1 + creatorCount)
```

`remaining` is clamped at 0 if spend exceeds budget. Missing rate fields are treated as 0. `creatorCount` missing is 0.

### 6.1 Freshness factor

New listings matter: early clippers take the budget. Age is measured from `listedAt`, then `launchDate`, then `createdAt`, then `first_seen_at` / now.

```
ageDays = max(0, (now - listedAt) / 86400)
freshness = FRESHNESS_FLOOR + (1 - FRESHNESS_FLOOR) * exp(-ageDays / FRESHNESS_HALFLIFE_DAYS)
```

Defaults: `FRESHNESS_FLOOR = 0.25`, `FRESHNESS_HALFLIFE_DAYS = 7`.

| Age | Freshness (defaults) |
|---|---|
| 0 days | 1.00 |
| 7 days | ≈ 0.526 |
| 14 days | ≈ 0.351 |
| 30 days | ≈ 0.260 |
| ∞ | 0.25 |

Final ranking score:

```
score = baseScore * freshness
```

Snapshots store both `base_score` and `score` so spend velocity can be studied without the age term moving the goalposts.

## 7. Filters, flags, and tags

A campaign is stored regardless of filters. `is_candidate` means it is worth showing in a ranked list and fetching a brief.

### 7.1 Hard filters (must all pass to be a candidate)

1. `payoutType === "cpm"` (only). Pool, per-post, and retainer are stored but excluded.
2. `remaining >= 1000` (dollars).
3. `requiresApplication === false`.
4. **Platforms filter:** the campaign's `platforms` intersect `ENABLED_PLATFORMS`. Default `youtube,tiktok,instagram,x` (the planned posting set; music campaigns almost never pay on X, which is fine — overlap with YouTube/TikTok/Instagram still passes). Narrow this to live accounts (Wave 1: `youtube,tiktok`) when you want the candidate list to match what you can actually post to today. Facebook is omitted by default because open budget there has been negligible; add it via env if needed.

Failed checks are appended to `exclusion_reasons` (`not_cpm`, `remaining_below_1000`, `requires_application`, `no_enabled_platform`).

### 7.2 Flags (do not exclude)

- **`flag_rate_over_cap`:** `maxRatePer1K > 20`. Lesson from a bad listing that showed $1,000 per 1K views. Still a candidate if filters pass; the UI must show the flag so a human looks twice.
- **`flag_stale_zero_creators`:** `creatorCount === 0` and listing age ≥ `STALE_ZERO_CREATOR_DAYS` (default **60**, “months old”). Hidden catches are common on untouched old listings.

### 7.3 UGC vs clipping

`content_kind` is `ugc` when the campaign `name` or `description` matches any of these case-insensitive keywords / phrases:

- `long-form ugc`, `long form ugc`
- `talking-head ugc`, `talking head ugc`, `talking-head`, `talking head`
- `split-screen ugc`, `split screen ugc`, `split-screen`, `split screen`
- `film yourself`
- standalone `ugc` (word boundary)
- `on camera`, `on-camera`

Otherwise `content_kind = clipping`. UGC rows can still be candidates (rates are often higher) but must be labeled so they are not queued into the clipping factory.

### 7.4 Niche → brand mapping

Match against `categories[].name`, `name`, and `description` (case-insensitive). A campaign may map to more than one brand; `brands` and `niches` are arrays. No match → empty arrays (unmapped, still a candidate if filters pass).

| Brand | Niche keywords |
|---|---|
| **Clipworthy** | entertainment, streamer(s), streaming, twitch, podcast(s), pop culture, celebrity/celebrities/celeb, hollywood, influencer moments |
| **Founder Minute** | business, finance, financial, personal brand, founder(s), entrepreneur(ship), investing, investor, money, startup(s), venture |
| **Hook on Repeat** | music, artist, song(s), album, concert, rap, hip hop, hip-hop, lyric(s), musician, dj, band |
| **Dub Daily** | gaming, gamer(s), game(s), roblox, fortnite, call of duty, cod, valorant, league of legends, esports, minecraft, warzone |

Keyword lists live in `supabase/functions/_shared/tagging.ts` so they can be extended without a migration.

## 8. Alerts

Speed matters: early clippers get the budget.

- **Pluggable channel** via `ALERT_CHANNEL`: `resend` \| `webhook` \| `none`.
- Default resolution: `resend` if `RESEND_API_KEY` is set, else `webhook` if `ALERT_WEBHOOK_URL` is set, else `none`.
- **Resend-style email:** `POST https://api.resend.com/emails` (overridable with `ALERT_WEBHOOK_URL`) using `RESEND_API_KEY`, `ALERT_FROM_EMAIL`, `ALERT_TO_EMAIL`.
- **Generic webhook:** `POST ALERT_WEBHOOK_URL` with a JSON body `{ type, generatedAt, campaigns: [...] }` and optional `ALERT_WEBHOOK_BEARER`. Any relay (Zapier, Make, a small mailer, a chat incoming webhook) can sit behind this.
- **When:** after a fetch, for campaigns where `is_candidate`, `score >= ALERT_MIN_SCORE` (default `2000`), and `alerted_at` is null. Cap a single email/payload at `ALERT_MAX_ITEMS` (default 20), highest score first.
- **Bootstrap:** if the `campaigns` table was empty at the start of the run, skip sending (backfill would otherwise dump the whole marketplace). Those rows still get `alerted_at` set so the next hour only reports truly new qualifiers.
- Flagged campaigns (`rate_over_cap`, `stale_zero_creators`, `ugc`) are included in the payload with their flags visible.

## 9. Environment variables

See `.env.example`. Secrets exist only in env / `supabase secrets`, never in git.

| Variable | Required | Default | Role |
|---|---|---|---|
| `WHOP_SESSION_COOKIE` | yes (live fetch) | — | Raw `Cookie` header from a signed-in Content Rewards session |
| `WHOP_API_HOST` | no | `https://b4e0vdqv6zgqeqj4pfgm.apps.whop.com` | Feed host |
| `WHOP_USER_AGENT` | no | documented browser UA | Configurable; some hosts reject empty UAs |
| `WHOP_BRIEF_URL_TEMPLATE` | no | `{host}/api/campaign/campaigns/{id}` | **TODO-verify** |
| `WHOP_CAMPAIGN_PAGE_URL_TEMPLATE` | no | `{host}/c/campaigns/{id}` | **TODO-verify** (used in alerts as a hint link) |
| `PAGE_DELAY_MS` | no | `400` | Pause between pages |
| `ENABLED_PLATFORMS` | no | `youtube,tiktok,instagram,x` | Platforms filter |
| `MIN_REMAINING_DOLLARS` | no | `1000` | Candidate floor |
| `MAX_RATE_PER_1K_FLAG` | no | `20` | Flag, do not drop |
| `STALE_ZERO_CREATOR_DAYS` | no | `60` | Flag, do not drop |
| `FRESHNESS_FLOOR` | no | `0.25` | See §6.1 |
| `FRESHNESS_HALFLIFE_DAYS` | no | `7` | See §6.1 |
| `ALERT_CHANNEL` | no | auto | `resend` \| `webhook` \| `none` |
| `ALERT_WEBHOOK_URL` | for webhook / optional Resend override | — | Destination |
| `ALERT_WEBHOOK_BEARER` | no | — | Optional bearer for generic webhook |
| `RESEND_API_KEY` | for resend | — | Resend auth |
| `ALERT_FROM_EMAIL` | for resend | — | From |
| `ALERT_TO_EMAIL` | for resend | — | To |
| `ALERT_MIN_SCORE` | no | `2000` | Alert threshold |
| `ALERT_MAX_ITEMS` | no | `20` | Cap per run |
| `BRIEF_REFRESH_HOURS` | no | `24` | Re-fetch cadence |
| `BRIEF_BATCH_SIZE` | no | `25` | Briefs per run |
| `CRON_SECRET` | production | — | Shared secret for function invokes |
| `SUPABASE_URL` | functions | injected on hosted | DB |
| `SUPABASE_SERVICE_ROLE_KEY` | functions | injected on hosted | DB writes |

## 10. Phase 0 exit test

A script prints **today's campaigns with rate and remaining budget from the live feed**.

```bash
deno run --allow-net --allow-env --env-file=.env scripts/print-campaigns.ts
```

Success: the script paginates the live discover feed (same path and 400 ms pacing as the scout) and prints each campaign's name, organization, payout type, rate per 1K (dollars), remaining budget (dollars), creator count, and platforms. It does not require Supabase. Use `--candidates` to apply the same filters as the scout, and `--json` for machine-readable output.

Phase 1's later exit test (a new campaign appearing in the review app within an hour) is out of scope here.

## 11. TODO-verify

Items that must be checked against a live signed-in session before trusting production behavior:

1. **Brief URL pattern.** Default template `{host}/api/campaign/campaigns/{id}` and page hint `{host}/c/campaigns/{id}` are guesses. Capture the real XHR from a campaign detail page and set `WHOP_BRIEF_URL_TEMPLATE` / `WHOP_CAMPAIGN_PAGE_URL_TEMPLATE` accordingly.
2. **Brief JSON shape.** Field names for rules / creator requirements / references are assumed, not confirmed.
3. **Cookie name(s) and expiry.** Paste the full `Cookie` header value. Plan to refresh it when fetches start returning 401.
4. **Whop terms of use.** The discover endpoint is internal/undocumented. Confirm automation at ~1 request burst per hour (about 14 pages + a small brief batch) is acceptable before leaving cron on.
5. **Feed schema drift.** `raw_summary` is stored so a changed payload can be diffed. Re-check fields if upserts start failing validation.
6. **Enabled platforms vs live accounts.** Tighten `ENABLED_PLATFORMS` as soon as you want candidates to match accounts that actually exist.

## 12. Isolation and compliance reminders

- New Supabase project, new repo, new Vercel project, new cloud/social apps, new secrets.
- No view buying, no engagement bots, no near-identical posts across accounts.
- Only campaign-provided source material in later ingest phases.
- Human approval for joining campaigns and for the first posts on each account.
