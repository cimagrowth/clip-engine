/**
 * Phase 0 exit test: print today's campaigns with rate and remaining budget
 * from the live Whop Content Rewards discover feed.
 *
 *   deno run --allow-net --allow-env --env-file=.env scripts/print-campaigns.ts
 *   deno run --allow-net --allow-env --env-file=.env scripts/print-campaigns.ts --candidates
 *   deno run --allow-net --allow-env --env-file=.env scripts/print-campaigns.ts --json
 *
 * Does not write to the database. Requires WHOP_SESSION_COOKIE.
 */
import { loadConfig } from "../supabase/functions/_shared/env.ts";
import { evaluateCampaigns } from "../supabase/functions/_shared/evaluate.ts";
import type { EvaluatedCampaign } from "../supabase/functions/_shared/types.ts";
import { fetchAllDiscoverCampaigns } from "../supabase/functions/_shared/whop.ts";

function dollars(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function printTable(rows: EvaluatedCampaign[]): void {
  const header = [
    "rate/1K".padStart(10),
    "remaining".padStart(12),
    "creators".padStart(8),
    "score".padStart(10),
    "type".padEnd(10),
    "flags".padEnd(16),
    "platforms".padEnd(28),
    "name",
  ].join("  ");
  console.log(header);
  console.log("-".repeat(120));
  for (const row of rows) {
    const flags = [
      row.tags.contentKind === "ugc" ? "ugc" : "",
      row.filter.flagRateOverCap ? "hi-rate" : "",
      row.filter.flagStaleZeroCreators ? "stale0" : "",
    ].filter(Boolean).join(",") || "—";
    console.log(
      [
        dollars(row.score.maxRatePer1K).padStart(10),
        dollars(row.score.remainingDollars).padStart(12),
        String(row.score.creatorCount).padStart(8),
        row.score.score.toFixed(1).padStart(10),
        row.payoutType.padEnd(10),
        flags.padEnd(16),
        (row.summary.platforms ?? []).join(",").padEnd(28),
        `${row.summary.name ?? "(untitled)"} — ${row.summary.organizationName ?? ""}`,
      ].join("  "),
    );
  }
}

const args = new Set(Deno.args);
const config = loadConfig((key) => Deno.env.get(key));

if (!config.whopSessionCookie) {
  console.error("WHOP_SESSION_COOKIE is required to hit the live feed.");
  Deno.exit(1);
}

const now = new Date();
const { campaigns, pagesFetched } = await fetchAllDiscoverCampaigns(config);
const evaluated = evaluateCampaigns(campaigns, {
  now,
  filter: config.filter,
  freshnessFloor: config.freshnessFloor,
  freshnessHalflifeDays: config.freshnessHalflifeDays,
});
const selected = args.has("--candidates")
  ? evaluated.filter((item) => item.filter.isCandidate)
  : evaluated;

const sorted = [...selected].sort((a, b) => b.score.score - a.score.score);

if (args.has("--json")) {
  console.log(JSON.stringify({
    fetchedAt: now.toISOString(),
    pagesFetched,
    total: evaluated.length,
    printed: sorted.length,
    candidatesOnly: args.has("--candidates"),
    campaigns: sorted.map((item) => ({
      id: item.summary.id,
      name: item.summary.name,
      organizationName: item.summary.organizationName,
      payoutType: item.payoutType,
      ratePer1K: item.score.maxRatePer1K,
      remainingDollars: item.score.remainingDollars,
      creatorCount: item.score.creatorCount,
      score: item.score.score,
      platforms: item.summary.platforms ?? [],
      isCandidate: item.filter.isCandidate,
      exclusionReasons: item.filter.exclusionReasons,
      contentKind: item.tags.contentKind,
      brands: item.tags.brands,
    })),
  }, null, 2));
} else {
  console.log(`Clip Engine — Whop campaigns`);
  console.log(`Fetched at ${now.toISOString()} (UTC) / ${
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  } America/New_York`);
  console.log(
    `Pages: ${pagesFetched}  seen: ${evaluated.length}  printed: ${sorted.length}${
      args.has("--candidates") ? " (candidates only)" : ""
    }`,
  );
  console.log("");
  printTable(sorted);
}

console.error(
  "Note: the discover endpoint is internal/undocumented. Check Whop's terms before heavy automation.",
);
