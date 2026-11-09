import { assertEquals } from "jsr:@std/assert@1";
import { FIXTURES } from "./fixtures.ts";
import { tagCampaign } from "./tagging.ts";

Deno.test("tags Long-form / talking-head / film yourself as UGC", () => {
  const tagged = tagCampaign(FIXTURES.longFormUgc);
  assertEquals(tagged.contentKind, "ugc");
  assertEquals(tagged.ugcMatchedTerms.includes("long-form ugc"), true);
  assertEquals(tagged.ugcMatchedTerms.includes("talking-head ugc"), true);
  assertEquals(tagged.ugcMatchedTerms.includes("film yourself"), true);
});

Deno.test("tags Split-Screen UGC from the description", () => {
  const tagged = tagCampaign(FIXTURES.splitScreenUgc);
  assertEquals(tagged.contentKind, "ugc");
  assertEquals(tagged.ugcMatchedTerms.includes("split-screen ugc"), true);
});

Deno.test("defaults ordinary clipping campaigns to clipping", () => {
  assertEquals(tagCampaign(FIXTURES.devin).contentKind, "clipping");
});

Deno.test("maps niches onto the four brands", () => {
  assertEquals(tagCampaign(FIXTURES.devin).brands, ["clipworthy"]);
  assertEquals(tagCampaign(FIXTURES.longFormUgc).brands, ["founder_minute"]);
  assertEquals(tagCampaign(FIXTURES.needsApplication).brands, ["hook_on_repeat"]);
  assertEquals(tagCampaign(FIXTURES.robloxGame).brands, ["dub_daily"]);
  assertEquals(tagCampaign(FIXTURES.staleZero).brands, ["clipworthy"]);
});
