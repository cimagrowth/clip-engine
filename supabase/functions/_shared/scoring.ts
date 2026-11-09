import type { ScoreBreakdown, WhopCampaignSummary, WhopPayout } from "./types.ts";

export interface FreshnessConfig {
  now?: Date;
  floor?: number;
  halfLifeDays?: number;
}

export function centsToDollars(cents: number | null | undefined): number {
  if (cents == null || Number.isNaN(cents)) return 0;
  return cents / 100;
}

export function remainingDollars(
  budgetCents: number | null | undefined,
  spentCents: number | null | undefined,
): number {
  const remaining = centsToDollars(budgetCents) - centsToDollars(spentCents);
  return remaining > 0 ? remaining : 0;
}

export function remainingCents(
  budgetCents: number | null | undefined,
  spentCents: number | null | undefined,
): number {
  const budget = budgetCents ?? 0;
  const spent = spentCents ?? 0;
  const leftover = budget - spent;
  return leftover > 0 ? leftover : 0;
}

function rateFromCents(cents: number | null | undefined): number {
  if (cents == null || Number.isNaN(cents) || cents < 0) return 0;
  return cents / 100;
}

/** Highest dollars-per-1K rate across headline CPM fields and per-platform payouts. */
export function maxRatePer1K(summary: WhopCampaignSummary): number {
  const candidates: number[] = [
    rateFromCents(summary.cpmMaxRateCents),
    rateFromCents(summary.cpmMinRateCents),
    rateFromCents(summary.primaryPayoutCents),
  ];
  for (const payout of summary.payouts ?? []) {
    candidates.push(rateFromCents((payout as WhopPayout).rateCents));
  }
  return candidates.reduce((max, value) => (value > max ? value : max), 0);
}

export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function listingTimestamp(summary: WhopCampaignSummary): Date | null {
  return (
    parseTimestamp(summary.listedAt) ??
    parseTimestamp(summary.launchDate) ??
    parseTimestamp(summary.createdAt)
  );
}

/**
 * freshness = floor + (1 - floor) * exp(-ageDays / halfLifeDays)
 *
 * Defaults: floor 0.25, half-life 7 days. Brand-new listings score at 1.0;
 * very old listings approach the floor so a huge remaining budget can still rank.
 */
export function freshnessFactor(
  summary: WhopCampaignSummary,
  config: FreshnessConfig = {},
): { freshness: number; ageDays: number } {
  const now = config.now ?? new Date();
  const floor = config.floor ?? 0.25;
  const halfLifeDays = config.halfLifeDays ?? 7;
  const listed = listingTimestamp(summary) ?? now;
  const ageMs = Math.max(0, now.getTime() - listed.getTime());
  const ageDays = ageMs / 86_400_000;
  const freshness = floor + (1 - floor) * Math.exp(-ageDays / halfLifeDays);
  return { freshness, ageDays };
}

/**
 * remaining = (budgetCents - metrics.budgetSpentCents) / 100
 * baseScore = maxRatePer1K * remaining / sqrt(1 + creatorCount)
 * score     = baseScore * freshness
 */
export function scoreCampaign(
  summary: WhopCampaignSummary,
  config: FreshnessConfig = {},
): ScoreBreakdown {
  const remaining = remainingDollars(
    summary.budgetCents,
    summary.metrics?.budgetSpentCents,
  );
  const leftoverCents = remainingCents(
    summary.budgetCents,
    summary.metrics?.budgetSpentCents,
  );
  const rate = maxRatePer1K(summary);
  const creatorCount = summary.metrics?.creatorCount ?? 0;
  const safeCreators = creatorCount >= 0 ? creatorCount : 0;
  const baseScore = rate * remaining / Math.sqrt(1 + safeCreators);
  const { freshness, ageDays } = freshnessFactor(summary, config);
  return {
    remainingDollars: remaining,
    remainingCents: leftoverCents,
    maxRatePer1K: rate,
    creatorCount: safeCreators,
    ageDays,
    freshness,
    baseScore,
    score: baseScore * freshness,
  };
}
