import { maxRatePer1K, remainingDollars } from "./scoring.ts";
import type {
  ExclusionReason,
  FilterConfig,
  FilterResult,
  WhopCampaignSummary,
} from "./types.ts";
import { listingTimestamp } from "./scoring.ts";

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  minRemainingDollars: 1000,
  enabledPlatforms: ["youtube", "tiktok", "instagram", "x"],
  maxRatePer1KFlag: 20,
  staleZeroCreatorDays: 60,
};

export function normalizePayoutType(
  raw: string | null | undefined,
): "cpm" | "pool" | "per_post" | "retainer" | "unknown" {
  const value = (raw ?? "").trim();
  if (value === "cpm") return "cpm";
  if (value === "pool") return "pool";
  if (value === "perPost" || value === "per_post") return "per_post";
  if (value === "retainer") return "retainer";
  return "unknown";
}

export function normalizePlatform(raw: string): string {
  return raw.trim().toLowerCase();
}

export function hasEnabledPlatform(
  campaignPlatforms: string[] | undefined,
  enabledPlatforms: string[],
): boolean {
  if (enabledPlatforms.length === 0) return true;
  const enabled = new Set(enabledPlatforms.map(normalizePlatform));
  return (campaignPlatforms ?? []).some((platform) =>
    enabled.has(normalizePlatform(platform))
  );
}

export function filterCampaign(
  summary: WhopCampaignSummary,
  config: FilterConfig = DEFAULT_FILTER_CONFIG,
  now: Date = new Date(),
): FilterResult {
  const reasons: ExclusionReason[] = [];
  const payoutType = normalizePayoutType(summary.payoutType);
  if (payoutType !== "cpm") reasons.push("not_cpm");

  const remaining = remainingDollars(
    summary.budgetCents,
    summary.metrics?.budgetSpentCents,
  );
  if (remaining < config.minRemainingDollars) {
    reasons.push("remaining_below_min");
  }

  if (summary.requiresApplication === true) {
    reasons.push("requires_application");
  }

  if (!hasEnabledPlatform(summary.platforms, config.enabledPlatforms)) {
    reasons.push("no_enabled_platform");
  }

  const rate = maxRatePer1K(summary);
  const listed = listingTimestamp(summary);
  const ageDays = listed
    ? Math.max(0, now.getTime() - listed.getTime()) / 86_400_000
    : 0;
  const creatorCount = summary.metrics?.creatorCount ?? 0;

  return {
    isCandidate: reasons.length === 0,
    exclusionReasons: reasons,
    flagRateOverCap: rate > config.maxRatePer1KFlag,
    flagStaleZeroCreators:
      creatorCount === 0 && ageDays >= config.staleZeroCreatorDays,
  };
}
