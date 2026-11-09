-- Clip Engine initial schema
-- Isolated personal project. Apply only to the dedicated Clip Engine Supabase database.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type payout_type as enum ('cpm', 'pool', 'per_post', 'retainer', 'unknown');
create type content_kind as enum ('clipping', 'ugc', 'unknown');
create type brand_key as enum (
  'clipworthy',
  'founder_minute',
  'hook_on_repeat',
  'dub_daily'
);
create type platform_key as enum (
  'youtube',
  'tiktok',
  'instagram',
  'x',
  'facebook'
);
create type account_status as enum ('warming', 'active', 'paused', 'banned');
create type clip_status as enum ('draft', 'approved', 'rejected');
create type submission_status as enum (
  'pending',
  'submitted',
  'approved',
  'rejected',
  'paid'
);
create type scout_run_kind as enum ('fetch', 'briefs', 'print');

-- ---------------------------------------------------------------------------
-- Updated-at helper
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  whop_id text not null unique,
  name text not null,
  description text,
  status text not null default 'active',
  payout_type payout_type not null,
  budget_cents bigint not null default 0 check (budget_cents >= 0),
  cpm_min_rate_cents integer check (cpm_min_rate_cents is null or cpm_min_rate_cents >= 0),
  cpm_max_rate_cents integer check (cpm_max_rate_cents is null or cpm_max_rate_cents >= 0),
  primary_payout_cents integer check (primary_payout_cents is null or primary_payout_cents >= 0),
  payouts jsonb not null default '[]'::jsonb,
  platforms text[] not null default '{}',
  categories jsonb not null default '[]'::jsonb,
  requires_application boolean not null default false,
  private boolean not null default false,
  retainer_spots_total integer check (retainer_spots_total is null or retainer_spots_total >= 0),
  whop_created_at timestamptz,
  launch_date timestamptz,
  listed_at timestamptz,
  whop_updated_at timestamptz,
  organization_name text,
  organization_id text,
  organization_verified boolean,
  organization_profile_handle text,
  organization_experience_id text,
  brief_counts jsonb,
  reference_materials jsonb not null default '[]'::jsonb,
  featured_score numeric,
  banner text,
  organization_logo_url text,
  budget_spent_cents bigint not null default 0 check (budget_spent_cents >= 0),
  budget_progress_bps integer,
  total_views bigint not null default 0 check (total_views >= 0),
  creator_count integer not null default 0 check (creator_count >= 0),
  approved_submission_count integer not null default 0 check (approved_submission_count >= 0),
  paid_out_cents bigint not null default 0 check (paid_out_cents >= 0),
  metrics_updated_at timestamptz,
  remaining_budget_cents bigint not null default 0,
  max_rate_per_1k numeric(12, 4) not null default 0 check (max_rate_per_1k >= 0),
  base_score numeric(18, 6) not null default 0,
  freshness_factor numeric(8, 6) not null default 1 check (freshness_factor >= 0),
  score numeric(18, 6) not null default 0,
  content_kind content_kind not null default 'unknown',
  niches text[] not null default '{}',
  brands text[] not null default '{}',
  is_candidate boolean not null default false,
  flag_rate_over_cap boolean not null default false,
  flag_stale_zero_creators boolean not null default false,
  exclusion_reasons text[] not null default '{}',
  rules_text text,
  brief_json jsonb,
  brief_fetched_at timestamptz,
  brief_fetch_error text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_scored_at timestamptz,
  alerted_at timestamptz,
  raw_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_payouts_is_array check (jsonb_typeof(payouts) = 'array'),
  constraint campaigns_categories_is_array check (jsonb_typeof(categories) = 'array'),
  constraint campaigns_reference_materials_is_array check (jsonb_typeof(reference_materials) = 'array')
);

create index campaigns_score_candidate_idx
  on campaigns (score desc)
  where is_candidate = true;

create index campaigns_last_seen_idx on campaigns (last_seen_at desc);
create index campaigns_payout_type_idx on campaigns (payout_type);
create index campaigns_content_kind_idx on campaigns (content_kind);
create index campaigns_brands_idx on campaigns using gin (brands);
create index campaigns_platforms_idx on campaigns using gin (platforms);
create index campaigns_listed_at_idx on campaigns (listed_at desc);
create index campaigns_brief_due_idx
  on campaigns (score desc)
  where is_candidate = true and brief_fetched_at is null;

create trigger campaigns_set_updated_at
  before update on campaigns
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- campaign_snapshots
-- ---------------------------------------------------------------------------

create table campaign_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  captured_at timestamptz not null default now(),
  budget_cents bigint not null default 0 check (budget_cents >= 0),
  budget_spent_cents bigint not null default 0 check (budget_spent_cents >= 0),
  remaining_cents bigint not null default 0,
  total_views bigint not null default 0 check (total_views >= 0),
  creator_count integer not null default 0 check (creator_count >= 0),
  approved_submission_count integer not null default 0 check (approved_submission_count >= 0),
  paid_out_cents bigint not null default 0 check (paid_out_cents >= 0),
  base_score numeric(18, 6) not null default 0,
  freshness_factor numeric(8, 6) not null default 1,
  score numeric(18, 6) not null default 0
);

create index campaign_snapshots_campaign_captured_idx
  on campaign_snapshots (campaign_id, captured_at desc);

create index campaign_snapshots_captured_idx
  on campaign_snapshots (captured_at desc);

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

create table accounts (
  id uuid primary key default gen_random_uuid(),
  brand brand_key not null,
  platform platform_key not null,
  handle text not null check (char_length(handle) between 1 and 64),
  status account_status not null default 'warming',
  daily_cap integer not null default 3 check (daily_cap >= 0),
  warmup_day integer not null default 1 check (warmup_day >= 0),
  email_plus_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand, platform, handle)
);

create index accounts_status_idx on accounts (status);
create index accounts_brand_platform_idx on accounts (brand, platform);

create trigger accounts_set_updated_at
  before update on accounts
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------------

create table sources (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  url text not null,
  storage_path text,
  duration_seconds numeric(12, 3) check (duration_seconds is null or duration_seconds >= 0),
  transcript text,
  provenance text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sources_campaign_idx on sources (campaign_id);
create unique index sources_campaign_url_idx on sources (campaign_id, url);

create trigger sources_set_updated_at
  before update on sources
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- clips
-- ---------------------------------------------------------------------------

create table clips (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  start_seconds numeric(12, 3) not null default 0 check (start_seconds >= 0),
  end_seconds numeric(12, 3) not null check (end_seconds > 0),
  hook text,
  caption text,
  render_path text,
  status clip_status not null default 'draft',
  checklist_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clips_window_order check (end_seconds > start_seconds)
);

create index clips_campaign_status_idx on clips (campaign_id, status);
create index clips_source_idx on clips (source_id);

create trigger clips_set_updated_at
  before update on clips
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------

create table posts (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references clips (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete restrict,
  platform_post_id text,
  url text,
  posted_at timestamptz,
  whop_submission_id text,
  submission_status submission_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_account_posted_idx on posts (account_id, posted_at desc);
create index posts_clip_idx on posts (clip_id);
create index posts_submission_status_idx on posts (submission_status);
create unique index posts_account_platform_post_idx
  on posts (account_id, platform_post_id)
  where platform_post_id is not null;

create trigger posts_set_updated_at
  before update on posts
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- metrics (per-post time series)
-- ---------------------------------------------------------------------------

create table metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  captured_at timestamptz not null default now(),
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  screenshot_path text,
  est_earnings_cents bigint check (est_earnings_cents is null or est_earnings_cents >= 0)
);

create index metrics_post_captured_idx on metrics (post_id, captured_at desc);

-- ---------------------------------------------------------------------------
-- scout_runs
-- ---------------------------------------------------------------------------

create table scout_runs (
  id uuid primary key default gen_random_uuid(),
  kind scout_run_kind not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  pages_fetched integer check (pages_fetched is null or pages_fetched >= 0),
  campaigns_seen integer check (campaigns_seen is null or campaigns_seen >= 0),
  candidates integer check (candidates is null or candidates >= 0),
  upserts integer check (upserts is null or upserts >= 0),
  snapshots integer check (snapshots is null or snapshots >= 0),
  alerts_sent integer check (alerts_sent is null or alerts_sent >= 0),
  error text,
  meta jsonb
);

create index scout_runs_started_idx on scout_runs (started_at desc);
create index scout_runs_kind_started_idx on scout_runs (kind, started_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Anon has no policies (deny). The service role used by Edge Functions bypasses
-- RLS. Add authenticated read/write policies when the review app lands.
-- ---------------------------------------------------------------------------

alter table campaigns enable row level security;
alter table campaign_snapshots enable row level security;
alter table accounts enable row level security;
alter table sources enable row level security;
alter table clips enable row level security;
alter table posts enable row level security;
alter table metrics enable row level security;
alter table scout_runs enable row level security;
