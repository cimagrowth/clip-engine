import { filterCampaign, normalizePayoutType } from "./filters.ts";
import { scoreCampaign } from "./scoring.ts";
import { tagCampaign } from "./tagging.ts";
import type {
  EvaluatedCampaign,
  FilterConfig,
  PayoutType,
  WhopCampaignSummary,
} from "./types.ts";

export interface EvaluateOptions {
  now?: Date;
  filter?: FilterConfig;
  freshnessFloor?: number;
  freshnessHalflifeDays?: number;
}

export function evaluateCampaign(
  summary: WhopCampaignSummary,
  options: EvaluateOptions = {},
): EvaluatedCampaign {
  const now = options.now ?? new Date();
  const payoutType: PayoutType = normalizePayoutType(summary.payoutType);
  return {
    summary,
    payoutType,
    score: scoreCampaign(summary, {
      now,
      floor: options.freshnessFloor,
      halfLifeDays: options.freshnessHalflifeDays,
    }),
    filter: filterCampaign(summary, options.filter, now),
    tags: tagCampaign(summary),
  };
}

export function evaluateCampaigns(
  summaries: WhopCampaignSummary[],
  options: EvaluateOptions = {},
): EvaluatedCampaign[] {
  return summaries.map((summary) => evaluateCampaign(summary, options));
}
