import { assertEquals } from "jsr:@std/assert@1";
import { DEFAULT_FILTER_CONFIG, filterCampaign } from "./filters.ts";
import { FIXTURES, NOW } from "./fixtures.ts";

Deno.test("keeps CPM campaigns with >= $1000 remaining and no application", () => {
  const result = filterCampaign(FIXTURES.devin, DEFAULT_FILTER_CONFIG, NOW);
  assertEquals(result.isCandidate, true);
  assertEquals(result.exclusionReasons, []);
  assertEquals(result.flagRateOverCap, false);
});

Deno.test("excludes non-CPM, low remaining, and application-required", () => {
  assertEquals(
    filterCampaign(FIXTURES.poolPayout, DEFAULT_FILTER_CONFIG, NOW).exclusionReasons,
    ["not_cpm"],
  );
  assertEquals(
    filterCampaign(FIXTURES.lowBudget, DEFAULT_FILTER_CONFIG, NOW).exclusionReasons,
    ["remaining_below_min"],
  );
  assertEquals(
    filterCampaign(FIXTURES.needsApplication, DEFAULT_FILTER_CONFIG, NOW)
      .exclusionReasons,
    ["requires_application"],
  );
});

Deno.test("flags rates over $20/1K without excluding", () => {
  const result = filterCampaign(FIXTURES.coworkerBadRate, DEFAULT_FILTER_CONFIG, NOW);
  assertEquals(result.isCandidate, true);
  assertEquals(result.flagRateOverCap, true);
});

Deno.test("flags stale listings with zero creators without excluding", () => {
  const result = filterCampaign(FIXTURES.staleZero, DEFAULT_FILTER_CONFIG, NOW);
  assertEquals(result.isCandidate, true);
  assertEquals(result.flagStaleZeroCreators, true);
  const freshZero = filterCampaign(FIXTURES.devin, DEFAULT_FILTER_CONFIG, NOW);
  assertEquals(freshZero.flagStaleZeroCreators, false);
});

Deno.test("platforms filter drops campaigns with no overlap", () => {
  const result = filterCampaign(FIXTURES.facebookOnly, DEFAULT_FILTER_CONFIG, NOW);
  assertEquals(result.isCandidate, false);
  assertEquals(result.exclusionReasons, ["no_enabled_platform"]);
});
