export type PayoutType = "cpm" | "pool" | "per_post" | "retainer" | "unknown";

export type ContentKind = "clipping" | "ugc" | "unknown";

export type BrandKey =
  | "clipworthy"
  | "founder_minute"
  | "hook_on_repeat"
  | "dub_daily";

export type PlatformKey =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "x"
  | "facebook"
  | string;

export interface WhopPayout {
  platform?: string;
  rateCents?: number;
  minPayoutCents?: number;
  maxPayoutCents?: number;
  payoutType?: string;
}

export interface WhopCategory {
  id?: string;
  name?: string;
}

export interface WhopMetrics {
  budgetSpentCents?: number;
  budgetProgressBps?: number;
  totalViews?: number;
  creatorCount?: number;
  approvedSubmissionCount?: number;
  paidOutCents?: number;
  metricsUpdatedAt?: string;
}

export interface WhopCampaignSummary {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  payoutType?: string;
  budgetCents?: number;
  cpmMinRateCents?: number;
  cpmMaxRateCents?: number;
  primaryPayoutCents?: number;
  payouts?: WhopPayout[];
  platforms?: string[];
  categories?: WhopCategory[];
  requiresApplication?: boolean;
  private?: boolean;
  retainerSpotsTotal?: number | null;
  createdAt?: string;
  launchDate?: string;
  listedAt?: string;
  updatedAt?: string;
  organizationName?: string;
  organizationId?: string;
  organizationVerified?: boolean;
  organizationProfileHandle?: string;
  organizationExperienceId?: string;
  briefCounts?: Record<string, unknown> | null;
  referenceMaterials?: unknown[];
  metrics?: WhopMetrics;
  featuredScore?: number;
  banner?: string | null;
  organizationLogoUrl?: string | null;
  [key: string]: unknown;
}

export interface WhopPagination {
  count?: number;
  cursor?: string | null;
  limit?: number;
  nextCursor?: string | null;
  pageIndex?: number;
  servingId?: string;
}

export interface WhopDiscoverResponse {
  data?: WhopCampaignSummary[];
  pagination?: WhopPagination;
  success?: boolean;
}

export interface ScoreBreakdown {
  remainingDollars: number;
  remainingCents: number;
  maxRatePer1K: number;
  creatorCount: number;
  ageDays: number;
  freshness: number;
  baseScore: number;
  score: number;
}

export type ExclusionReason =
  | "not_cpm"
  | "remaining_below_min"
  | "requires_application"
  | "no_enabled_platform";

export interface FilterConfig {
  minRemainingDollars: number;
  enabledPlatforms: string[];
  maxRatePer1KFlag: number;
  staleZeroCreatorDays: number;
}

export interface FilterResult {
  isCandidate: boolean;
  exclusionReasons: ExclusionReason[];
  flagRateOverCap: boolean;
  flagStaleZeroCreators: boolean;
}

export interface TagResult {
  contentKind: ContentKind;
  niches: string[];
  brands: BrandKey[];
  ugcMatchedTerms: string[];
}

export interface EvaluatedCampaign {
  summary: WhopCampaignSummary;
  payoutType: PayoutType;
  score: ScoreBreakdown;
  filter: FilterResult;
  tags: TagResult;
}

export interface AlertCampaign {
  whopId: string;
  name: string;
  organizationName: string | null;
  maxRatePer1K: number;
  remainingDollars: number;
  creatorCount: number;
  score: number;
  freshness: number;
  platforms: string[];
  brands: BrandKey[];
  contentKind: ContentKind;
  flagRateOverCap: boolean;
  flagStaleZeroCreators: boolean;
  pageUrlHint: string | null;
}

export interface AlertPayload {
  type: "new_high_scoring_campaigns";
  generatedAt: string;
  campaigns: AlertCampaign[];
}

export interface ScoutConfig {
  whopApiHost: string;
  whopSessionCookie: string;
  whopUserAgent: string;
  briefUrlTemplate: string;
  campaignPageUrlTemplate: string;
  pageDelayMs: number;
  filter: FilterConfig;
  freshnessFloor: number;
  freshnessHalflifeDays: number;
  alertChannel: "resend" | "webhook" | "none";
  alertWebhookUrl: string;
  alertWebhookBearer: string;
  resendApiKey: string;
  alertFromEmail: string;
  alertToEmail: string;
  alertMinScore: number;
  alertMaxItems: number;
  briefRefreshHours: number;
  briefBatchSize: number;
  cronSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}
