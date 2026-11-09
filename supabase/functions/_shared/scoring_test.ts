import { assertAlmostEquals, assertEquals } from "jsr:@std/assert@1";
import { FIXTURES, NOW } from "./fixtures.ts";
import { freshnessFactor, remainingDollars, scoreCampaign } from "./scoring.ts";

Deno.test("remaining dollars uses (budget - spent) / 100 and clamps at 0", () => {
  assertEquals(remainingDollars(1_500_000, 0), 15_000);
  assertEquals(remainingDollars(800_000, 140_000), 6_600);
  assertEquals(remainingDollars(100, 500), 0);
});

Deno.test("DEVIN base score matches maxRate * remaining / sqrt(1 + creators)", () => {
  const result = scoreCampaign(FIXTURES.devin, { now: NOW });
  assertEquals(result.remainingDollars, 15_000);
  assertEquals(result.maxRatePer1K, 5);
  assertEquals(result.creatorCount, 0);
  assertEquals(result.baseScore, 5 * 15_000 / Math.sqrt(1));
  assertAlmostEquals(result.freshness, 1, 0.02);
  assertAlmostEquals(result.score, result.baseScore * result.freshness, 1e-6);
});

Deno.test("UGC example uses creator count in the denominator", () => {
  const result = scoreCampaign(FIXTURES.longFormUgc, { now: NOW });
  assertEquals(result.remainingDollars, 6_600);
  assertEquals(result.maxRatePer1K, 16.5);
  const expected = 16.5 * 6_600 / Math.sqrt(1 + 4);
  assertAlmostEquals(result.baseScore, expected, 1e-6);
});

Deno.test("freshness decays toward the floor over weeks", () => {
  const fresh = freshnessFactor(FIXTURES.devin, { now: NOW });
  const stale = freshnessFactor(FIXTURES.staleZero, { now: NOW });
  assertAlmostEquals(fresh.freshness, 1, 0.02);
  assertEquals(stale.ageDays > 60, true);
  assertEquals(stale.freshness < 0.3, true);
  assertEquals(stale.freshness >= 0.25, true);
});

Deno.test("rate prefers the highest payouts[].rateCents when larger", () => {
  const result = scoreCampaign({
    ...FIXTURES.devin,
    cpmMaxRateCents: 200,
    payouts: [
      { platform: "youtube", rateCents: 200 },
      { platform: "tiktok", rateCents: 750 },
    ],
  }, { now: NOW });
  assertEquals(result.maxRatePer1K, 7.5);
});
