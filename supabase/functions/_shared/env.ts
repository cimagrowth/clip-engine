import { DEFAULT_FILTER_CONFIG } from "./filters.ts";
import type { ScoutConfig } from "./types.ts";

function readEnv(getEnv: (key: string) => string | undefined, key: string): string {
  return getEnv(key)?.trim() ?? "";
}

function readNumber(
  getEnv: (key: string) => string | undefined,
  key: string,
  fallback: number,
): number {
  const raw = getEnv(key);
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readList(
  getEnv: (key: string) => string | undefined,
  key: string,
  fallback: string[],
): string[] {
  const raw = getEnv(key);
  if (raw == null || raw.trim() === "") return fallback;
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function resolveAlertChannel(
  getEnv: (key: string) => string | undefined,
): "resend" | "webhook" | "none" {
  const explicit = readEnv(getEnv, "ALERT_CHANNEL").toLowerCase();
  if (explicit === "resend" || explicit === "webhook" || explicit === "none") {
    return explicit;
  }
  if (readEnv(getEnv, "RESEND_API_KEY")) return "resend";
  if (readEnv(getEnv, "ALERT_WEBHOOK_URL")) return "webhook";
  return "none";
}

export function loadConfig(
  getEnv: (key: string) => string | undefined = (key) =>
    (globalThis as { Deno?: { env: { get(k: string): string | undefined } } })
      .Deno?.env.get(key),
): ScoutConfig {
  const defaultHost = "https://b4e0vdqv6zgqeqj4pfgm.apps.whop.com";
  return {
    whopApiHost: readEnv(getEnv, "WHOP_API_HOST") || defaultHost,
    whopSessionCookie: readEnv(getEnv, "WHOP_SESSION_COOKIE"),
    whopUserAgent: readEnv(getEnv, "WHOP_USER_AGENT") ||
      "Mozilla/5.0 (compatible; ClipEngineScout/0.1)",
    briefUrlTemplate: readEnv(getEnv, "WHOP_BRIEF_URL_TEMPLATE") ||
      "{host}/api/campaign/campaigns/{id}",
    campaignPageUrlTemplate: readEnv(getEnv, "WHOP_CAMPAIGN_PAGE_URL_TEMPLATE") ||
      "{host}/c/campaigns/{id}",
    pageDelayMs: readNumber(getEnv, "PAGE_DELAY_MS", 400),
    filter: {
      minRemainingDollars: readNumber(
        getEnv,
        "MIN_REMAINING_DOLLARS",
        DEFAULT_FILTER_CONFIG.minRemainingDollars,
      ),
      enabledPlatforms: readList(
        getEnv,
        "ENABLED_PLATFORMS",
        DEFAULT_FILTER_CONFIG.enabledPlatforms,
      ),
      maxRatePer1KFlag: readNumber(
        getEnv,
        "MAX_RATE_PER_1K_FLAG",
        DEFAULT_FILTER_CONFIG.maxRatePer1KFlag,
      ),
      staleZeroCreatorDays: readNumber(
        getEnv,
        "STALE_ZERO_CREATOR_DAYS",
        DEFAULT_FILTER_CONFIG.staleZeroCreatorDays,
      ),
    },
    freshnessFloor: readNumber(getEnv, "FRESHNESS_FLOOR", 0.25),
    freshnessHalflifeDays: readNumber(getEnv, "FRESHNESS_HALFLIFE_DAYS", 7),
    alertChannel: resolveAlertChannel(getEnv),
    alertWebhookUrl: readEnv(getEnv, "ALERT_WEBHOOK_URL"),
    alertWebhookBearer: readEnv(getEnv, "ALERT_WEBHOOK_BEARER"),
    resendApiKey: readEnv(getEnv, "RESEND_API_KEY"),
    alertFromEmail: readEnv(getEnv, "ALERT_FROM_EMAIL"),
    alertToEmail: readEnv(getEnv, "ALERT_TO_EMAIL"),
    alertMinScore: readNumber(getEnv, "ALERT_MIN_SCORE", 2000),
    alertMaxItems: readNumber(getEnv, "ALERT_MAX_ITEMS", 20),
    briefRefreshHours: readNumber(getEnv, "BRIEF_REFRESH_HOURS", 24),
    briefBatchSize: readNumber(getEnv, "BRIEF_BATCH_SIZE", 25),
    cronSecret: readEnv(getEnv, "CRON_SECRET"),
    supabaseUrl: readEnv(getEnv, "SUPABASE_URL"),
    supabaseServiceRoleKey: readEnv(getEnv, "SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function applyUrlTemplate(
  template: string,
  vars: { host: string; id: string },
): string {
  return template
    .replaceAll("{host}", vars.host.replace(/\/$/, ""))
    .replaceAll("{id}", encodeURIComponent(vars.id));
}

export function requireCronSecret(
  request: Request,
  secret: string,
): Response | null {
  if (!secret) return null;
  const bearer = request.headers.get("authorization") ?? "";
  const header = request.headers.get("x-cron-secret") ?? "";
  const token = bearer.toLowerCase().startsWith("bearer ")
    ? bearer.slice(7).trim()
    : "";
  if (token === secret || header === secret) return null;
  return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
