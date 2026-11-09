import {
  createServiceClient,
  finishScoutRun,
  listBriefCandidates,
  startScoutRun,
  storeBrief,
} from "../_shared/db.ts";
import { loadConfig, requireCronSecret } from "../_shared/env.ts";
import { fetchCampaignBrief, sleep } from "../_shared/whop.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "GET") {
    return Response.json({
      ok: true,
      function: "scout-briefs",
      schedule: "15 * * * *",
      todoVerify: "WHOP_BRIEF_URL_TEMPLATE is unconfirmed",
    });
  }
  if (request.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const config = loadConfig();
  const unauthorized = requireCronSecret(request, config.cronSecret);
  if (unauthorized) return unauthorized;

  const client = createServiceClient(config);
  const runId = await startScoutRun(client, "briefs");

  try {
    const candidates = await listBriefCandidates(
      client,
      config.briefRefreshHours,
      config.briefBatchSize,
    );
    let stored = 0;
    let failures = 0;

    for (const [index, candidate] of candidates.entries()) {
      if (index > 0) await sleep(config.pageDelayMs);
      const result = await fetchCampaignBrief(config, candidate.whop_id);
      await storeBrief(client, candidate.id, result);
      if (result.ok && result.rulesText) stored += 1;
      else failures += 1;
    }

    await finishScoutRun(client, runId, {
      ok: true,
      campaigns_seen: candidates.length,
      upserts: stored,
      error: failures ? `${failures} brief fetches stored an error` : null,
      meta: {
        todoVerify: true,
        template: config.briefUrlTemplate,
        failures,
      },
    });

    return Response.json({
      ok: true,
      attempted: candidates.length,
      stored,
      failures,
      todoVerify: "Set WHOP_BRIEF_URL_TEMPLATE after capturing the live campaign page XHR",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishScoutRun(client, runId, { ok: false, error: message });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
});
