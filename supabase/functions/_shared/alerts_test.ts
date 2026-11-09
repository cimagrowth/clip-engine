import { assertEquals } from "jsr:@std/assert@1";
import { selectAlertCampaigns } from "./alerts.ts";
import { loadConfig } from "./env.ts";
import { evaluateCampaigns } from "./evaluate.ts";
import { ALL_FIXTURES, NOW } from "./fixtures.ts";

Deno.test("alerts only new high-scoring candidates and respects the cap", () => {
  const env = (key: string) => {
    if (key === "ALERT_MIN_SCORE") return "1000";
    if (key === "ALERT_MAX_ITEMS") return "2";
    if (key === "ALERT_CHANNEL") return "none";
    return undefined;
  };
  const config = loadConfig(env);
  const evaluated = evaluateCampaigns(ALL_FIXTURES, {
    now: NOW,
    filter: config.filter,
    freshnessFloor: config.freshnessFloor,
    freshnessHalflifeDays: config.freshnessHalflifeDays,
  });
  const selected = selectAlertCampaigns(evaluated, new Set(["camp_devin"]), config);
  assertEquals(selected.length <= 2, true);
  assertEquals(selected.some((item) => item.whopId === "camp_devin"), false);
  assertEquals(selected.every((item) => item.score >= 1000), true);
});
