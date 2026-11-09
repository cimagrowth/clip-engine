import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import type { EvaluatedCampaign, ScoutConfig } from "./types.ts";

export function createServiceClient(config: ScoutConfig): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function campaignsTableIsEmpty(client: SupabaseClient): Promise<boolean> {
  const { count, error } = await client
    .from("campaigns")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) === 0;
}

export async function startScoutRun(
  client: SupabaseClient,
  kind: "fetch" | "briefs",
): Promise<string> {
  const { data, error } = await client
    .from("scout_runs")
    .insert({ kind })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function finishScoutRun(
  client: SupabaseClient,
  id: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const { error } = await client
    .from("scout_runs")
    .update({ finished_at: new Date().toISOString(), ...fields })
    .eq("id", id);
  if (error) throw error;
}

function rowFromEvaluated(evaluated: EvaluatedCampaign, nowIso: string) {
  const { summary, score, filter, tags, payoutType } = evaluated;
  return {
    whop_id: summary.id,
    name: summary.name ?? "(untitled)",
    description: summary.description ?? null,
    status: summary.status ?? "active",
    payout_type: payoutType,
    budget_cents: summary.budgetCents ?? 0,
    cpm_min_rate_cents: summary.cpmMinRateCents ?? null,
    cpm_max_rate_cents: summary.cpmMaxRateCents ?? null,
    primary_payout_cents: summary.primaryPayoutCents ?? null,
    payouts: summary.payouts ?? [],
    platforms: summary.platforms ?? [],
    categories: summary.categories ?? [],
    requires_application: summary.requiresApplication === true,
    private: summary.private === true,
    retainer_spots_total: summary.retainerSpotsTotal ?? null,
    whop_created_at: summary.createdAt ?? null,
    launch_date: summary.launchDate ?? null,
    listed_at: summary.listedAt ?? null,
    whop_updated_at: summary.updatedAt ?? null,
    organization_name: summary.organizationName ?? null,
    organization_id: summary.organizationId ?? null,
    organization_verified: summary.organizationVerified ?? null,
    organization_profile_handle: summary.organizationProfileHandle ?? null,
    organization_experience_id: summary.organizationExperienceId ?? null,
    brief_counts: summary.briefCounts ?? null,
    reference_materials: summary.referenceMaterials ?? [],
    featured_score: summary.featuredScore ?? null,
    banner: summary.banner ?? null,
    organization_logo_url: summary.organizationLogoUrl ?? null,
    budget_spent_cents: summary.metrics?.budgetSpentCents ?? 0,
    budget_progress_bps: summary.metrics?.budgetProgressBps ?? null,
    total_views: summary.metrics?.totalViews ?? 0,
    creator_count: score.creatorCount,
    approved_submission_count: summary.metrics?.approvedSubmissionCount ?? 0,
    paid_out_cents: summary.metrics?.paidOutCents ?? 0,
    metrics_updated_at: summary.metrics?.metricsUpdatedAt ?? null,
    remaining_budget_cents: score.remainingCents,
    max_rate_per_1k: score.maxRatePer1K,
    base_score: score.baseScore,
    freshness_factor: score.freshness,
    score: score.score,
    content_kind: tags.contentKind,
    niches: tags.niches,
    brands: tags.brands,
    is_candidate: filter.isCandidate,
    flag_rate_over_cap: filter.flagRateOverCap,
    flag_stale_zero_creators: filter.flagStaleZeroCreators,
    exclusion_reasons: filter.exclusionReasons,
    last_seen_at: nowIso,
    last_scored_at: nowIso,
    raw_summary: summary,
  };
}

export async function upsertCampaigns(
  client: SupabaseClient,
  evaluated: EvaluatedCampaign[],
  now: Date,
): Promise<Map<string, string>> {
  const nowIso = now.toISOString();
  const rows = evaluated.map((item) => rowFromEvaluated(item, nowIso));
  const idByWhopId = new Map<string, string>();

  // Chunk to keep request size reasonable.
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await client
      .from("campaigns")
      .upsert(chunk, { onConflict: "whop_id" })
      .select("id, whop_id");
    if (error) throw error;
    for (const row of data ?? []) {
      idByWhopId.set(row.whop_id as string, row.id as string);
    }
  }
  return idByWhopId;
}

export async function insertSnapshots(
  client: SupabaseClient,
  evaluated: EvaluatedCampaign[],
  idByWhopId: Map<string, string>,
  capturedAt: Date,
): Promise<number> {
  const captured = capturedAt.toISOString();
  const rows = evaluated.flatMap((item) => {
    const campaignId = idByWhopId.get(item.summary.id);
    if (!campaignId) return [];
    return [{
      campaign_id: campaignId,
      captured_at: captured,
      budget_cents: item.summary.budgetCents ?? 0,
      budget_spent_cents: item.summary.metrics?.budgetSpentCents ?? 0,
      remaining_cents: item.score.remainingCents,
      total_views: item.summary.metrics?.totalViews ?? 0,
      creator_count: item.score.creatorCount,
      approved_submission_count: item.summary.metrics?.approvedSubmissionCount ?? 0,
      paid_out_cents: item.summary.metrics?.paidOutCents ?? 0,
      base_score: item.score.baseScore,
      freshness_factor: item.score.freshness,
      score: item.score.score,
    }];
  });

  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await client
      .from("campaign_snapshots")
      .insert(rows.slice(i, i + chunkSize));
    if (error) throw error;
  }
  return rows.length;
}

export async function loadAlertedWhopIds(
  client: SupabaseClient,
  whopIds: string[],
): Promise<Set<string>> {
  const alerted = new Set<string>();
  const chunkSize = 200;
  for (let i = 0; i < whopIds.length; i += chunkSize) {
    const chunk = whopIds.slice(i, i + chunkSize);
    const { data, error } = await client
      .from("campaigns")
      .select("whop_id")
      .in("whop_id", chunk)
      .not("alerted_at", "is", null);
    if (error) throw error;
    for (const row of data ?? []) alerted.add(row.whop_id as string);
  }
  return alerted;
}

export async function markAlerted(
  client: SupabaseClient,
  whopIds: string[],
  at: Date,
): Promise<void> {
  if (whopIds.length === 0) return;
  const { error } = await client
    .from("campaigns")
    .update({ alerted_at: at.toISOString() })
    .in("whop_id", whopIds);
  if (error) throw error;
}

export interface BriefCandidate {
  id: string;
  whop_id: string;
  name: string;
  score: number;
}

export async function listBriefCandidates(
  client: SupabaseClient,
  refreshHours: number,
  limit: number,
): Promise<BriefCandidate[]> {
  const cutoff = new Date(Date.now() - refreshHours * 3600 * 1000).toISOString();
  const { data, error } = await client
    .from("campaigns")
    .select("id, whop_id, name, score, brief_fetched_at")
    .eq("is_candidate", true)
    .or(`brief_fetched_at.is.null,brief_fetched_at.lt.${cutoff}`)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    whop_id: row.whop_id as string,
    name: row.name as string,
    score: Number(row.score),
  }));
}

export async function storeBrief(
  client: SupabaseClient,
  campaignId: string,
  result: {
    ok: boolean;
    rulesText: string | null;
    briefJson: Record<string, unknown> | null;
    error: string | null;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {
    brief_fetched_at: new Date().toISOString(),
    brief_fetch_error: result.error,
  };
  if (result.briefJson) patch.brief_json = result.briefJson;
  if (result.rulesText) patch.rules_text = result.rulesText;
  const { error } = await client.from("campaigns").update(patch).eq("id", campaignId);
  if (error) throw error;
}
