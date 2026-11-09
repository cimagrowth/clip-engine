import { selectAlertCampaigns, sendAlert } from "../_shared/alerts.ts";
import {
  campaignsTableIsEmpty,
  createServiceClient,
  finishScoutRun,
  insertSnapshots,
  loadAlertedWhopIds,
  markAlerted,
  startScoutRun,
  upsertCampaigns,
} from "../_shared/db.ts";
import { loadConfig, requireCronSecret } from "../_shared/env.ts";
import { evaluateCampaigns } from "../_shared/evaluate.ts";
import type { AlertPayload } from "../_shared/types.ts";
import { fetchAllDiscoverCampaigns } from "../_shared/whop.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "GET") {
    return Response.json({
      ok: true,
      function: "scout-fetch",
      schedule: "0 * * * *",
    });
  }
  if (request.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const config = loadConfig();
  const unauthorized = requireCronSecret(request, config.cronSecret);
  if (unauthorized) return unauthorized;

  const client = createServiceClient(config);
  const runId = await startScoutRun(client, "fetch");
  const now = new Date();

  try {
    const bootstrap = await campaignsTableIsEmpty(client);
    const { campaigns, pagesFetched } = await fetchAllDiscoverCampaigns(config);
    const evaluated = evaluateCampaigns(campaigns, {
      now,
      filter: config.filter,
      freshnessFloor: config.freshnessFloor,
      freshnessHalflifeDays: config.freshnessHalflifeDays,
    });
    const idByWhopId = await upsertCampaigns(client, evaluated, now);
    const snapshots = await insertSnapshots(client, evaluated, idByWhopId, now);

    const previouslyAlerted = await loadAlertedWhopIds(
      client,
      evaluated.map((item) => item.summary.id),
    );
    const alertable = selectAlertCampaigns(evaluated, previouslyAlerted, config);
    let alertsSent = 0;
    let alertError: string | undefined;

    if (bootstrap) {
      const allNewQualifiers = evaluated
        .filter((item) =>
          item.filter.isCandidate && item.score.score >= config.alertMinScore
        )
        .map((item) => item.summary.id);
      await markAlerted(client, allNewQualifiers, now);
    } else if (alertable.length > 0) {
      const payload: AlertPayload = {
        type: "new_high_scoring_campaigns",
        generatedAt: now.toISOString(),
        campaigns: alertable,
      };
      const result = await sendAlert(payload, config);
      if (result.sent) {
        alertsSent = alertable.length;
        await markAlerted(client, alertable.map((item) => item.whopId), now);
      } else {
        alertError = result.error ?? `alert channel ${result.channel} did not send`;
      }
    }

    const candidates = evaluated.filter((item) => item.filter.isCandidate).length;
    await finishScoutRun(client, runId, {
      ok: true,
      pages_fetched: pagesFetched,
      campaigns_seen: evaluated.length,
      candidates,
      upserts: idByWhopId.size,
      snapshots,
      alerts_sent: alertsSent,
      error: alertError ?? null,
      meta: { bootstrap, alertChannel: config.alertChannel },
    });

    return Response.json({
      ok: true,
      bootstrap,
      pagesFetched,
      campaignsSeen: evaluated.length,
      candidates,
      snapshots,
      alertsSent,
      alertError: alertError ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishScoutRun(client, runId, { ok: false, error: message });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
});
