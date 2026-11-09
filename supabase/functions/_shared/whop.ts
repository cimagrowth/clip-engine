/**
 * Client for the Whop Content Rewards discover feed.
 *
 * WARNING: This is an internal, undocumented endpoint. It requires a signed-in
 * session cookie, can change without notice, and Whop's terms must be checked
 * before heavy automation. The scout polls about once an hour and pauses
 * PAGE_DELAY_MS (default 400) between pages.
 */

import type { ScoutConfig, WhopCampaignSummary, WhopDiscoverResponse } from "./types.ts";
import { applyUrlTemplate } from "./env.ts";

export const DISCOVER_PATH = "/api/campaign/campaigns/discover";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function discoverUrl(host: string, cursor?: string | null): string {
  const base = host.replace(/\/$/, "");
  const params = new URLSearchParams({
    collapseGroups: "true",
    limit: "50",
    view: "summary",
    sortBy: "newest",
  });
  if (cursor) params.set("cursor", cursor);
  return `${base}${DISCOVER_PATH}?${params.toString()}`;
}

export function whopHeaders(config: Pick<ScoutConfig, "whopSessionCookie" | "whopUserAgent" | "whopApiHost">): HeadersInit {
  return {
    accept: "application/json, text/plain, */*",
    "user-agent": config.whopUserAgent,
    cookie: config.whopSessionCookie,
    origin: config.whopApiHost.replace(/\/$/, ""),
    referer: `${config.whopApiHost.replace(/\/$/, "")}/c/discover`,
  };
}

export class WhopHttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string, url: string) {
    super(`Whop request failed (${status}) ${url}: ${body.slice(0, 240)}`);
    this.status = status;
    this.body = body;
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.status >= 500 && attempt < retries) {
        await sleep(400 * attempt);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(400 * attempt);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchDiscoverPage(
  config: ScoutConfig,
  cursor?: string | null,
): Promise<WhopDiscoverResponse> {
  if (!config.whopSessionCookie) {
    throw new Error("WHOP_SESSION_COOKIE is not set");
  }
  const url = discoverUrl(config.whopApiHost, cursor);
  const response = await fetchWithRetry(url, {
    method: "GET",
    headers: whopHeaders(config),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new WhopHttpError(response.status, text, url);
  }
  return JSON.parse(text) as WhopDiscoverResponse;
}

export interface DiscoverCrawlResult {
  campaigns: WhopCampaignSummary[];
  pagesFetched: number;
}

export async function fetchAllDiscoverCampaigns(
  config: ScoutConfig,
  onPage?: (pageIndex: number, batch: WhopCampaignSummary[]) => void,
): Promise<DiscoverCrawlResult> {
  const seen = new Map<string, WhopCampaignSummary>();
  let cursor: string | null | undefined = undefined;
  let pagesFetched = 0;
  let isFirst = true;

  while (true) {
    if (!isFirst) await sleep(config.pageDelayMs);
    isFirst = false;
    const payload = await fetchDiscoverPage(config, cursor);
    const batch = payload.data ?? [];
    pagesFetched += 1;
    for (const campaign of batch) {
      if (campaign?.id && !seen.has(campaign.id)) {
        seen.set(campaign.id, campaign);
      }
    }
    onPage?.(pagesFetched, batch);
    const next = payload.pagination?.nextCursor ?? null;
    if (!next) break;
    cursor = next;
  }

  return { campaigns: [...seen.values()], pagesFetched };
}

export interface BriefFetchResult {
  ok: boolean;
  url: string;
  rulesText: string | null;
  briefJson: Record<string, unknown> | null;
  error: string | null;
  contentType: string | null;
}

function collectRulesText(value: unknown, bucket: string[]): void {
  if (value == null) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) bucket.push(trimmed);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectRulesText(item, bucket);
    return;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = [
      "contentRules",
      "content_rules",
      "creatorRequirements",
      "creator_requirements",
      "rules",
      "rulesText",
      "rules_text",
      "brief",
      "description",
      "text",
      "html",
      "markdown",
    ];
    for (const key of preferredKeys) {
      if (key in record) collectRulesText(record[key], bucket);
    }
    if ("data" in record) collectRulesText(record.data, bucket);
  }
}

function extractFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20_000);
}

/**
 * TODO-verify: WHOP_BRIEF_URL_TEMPLATE is a guess. Capture the real campaign
 * detail XHR and override the env var before trusting stored rules_text.
 */
export async function fetchCampaignBrief(
  config: ScoutConfig,
  whopId: string,
): Promise<BriefFetchResult> {
  const url = applyUrlTemplate(config.briefUrlTemplate, {
    host: config.whopApiHost,
    id: whopId,
  });
  try {
    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: whopHeaders(config),
    });
    const contentType = response.headers.get("content-type");
    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        url,
        rulesText: null,
        briefJson: null,
        error: `HTTP ${response.status}: ${text.slice(0, 240)}`,
        contentType,
      };
    }

    const looksJson = (contentType ?? "").includes("json") ||
      text.trim().startsWith("{") ||
      text.trim().startsWith("[");
    if (looksJson) {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const parts: string[] = [];
        collectRulesText(parsed, parts);
        return {
          ok: true,
          url,
          rulesText: parts.length ? parts.join("\n\n") : null,
          briefJson: {
            source: "json",
            todoVerify: true,
            fetchedUrl: url,
            body: parsed,
          },
          error: parts.length
            ? null
            : "JSON parsed but no rules-like fields were found (TODO-verify template/shape)",
          contentType,
        };
      } catch (error) {
        return {
          ok: false,
          url,
          rulesText: null,
          briefJson: null,
          error: `JSON parse failed: ${(error as Error).message}`,
          contentType,
        };
      }
    }

    const extracted = extractFromHtml(text);
    return {
      ok: Boolean(extracted),
      url,
      rulesText: extracted || null,
      briefJson: {
        source: "html",
        todoVerify: true,
        fetchedUrl: url,
      },
      error: extracted
        ? null
        : "HTML response contained no extractable text (TODO-verify template)",
      contentType,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      rulesText: null,
      briefJson: null,
      error: (error as Error).message,
      contentType: null,
    };
  }
}
