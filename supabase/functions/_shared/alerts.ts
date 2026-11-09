import { applyUrlTemplate } from "./env.ts";
import type {
  AlertCampaign,
  AlertPayload,
  EvaluatedCampaign,
  ScoutConfig,
} from "./types.ts";

export function toAlertCampaign(
  evaluated: EvaluatedCampaign,
  config: ScoutConfig,
): AlertCampaign {
  const { summary, score, filter, tags } = evaluated;
  return {
    whopId: summary.id,
    name: summary.name ?? "(untitled)",
    organizationName: summary.organizationName ?? null,
    maxRatePer1K: score.maxRatePer1K,
    remainingDollars: score.remainingDollars,
    creatorCount: score.creatorCount,
    score: score.score,
    freshness: score.freshness,
    platforms: summary.platforms ?? [],
    brands: tags.brands,
    contentKind: tags.contentKind,
    flagRateOverCap: filter.flagRateOverCap,
    flagStaleZeroCreators: filter.flagStaleZeroCreators,
    pageUrlHint: applyUrlTemplate(config.campaignPageUrlTemplate, {
      host: config.whopApiHost,
      id: summary.id,
    }),
  };
}

export function selectAlertCampaigns(
  evaluated: EvaluatedCampaign[],
  previouslyAlerted: Set<string>,
  config: ScoutConfig,
): AlertCampaign[] {
  return evaluated
    .filter((item) =>
      item.filter.isCandidate &&
      item.score.score >= config.alertMinScore &&
      !previouslyAlerted.has(item.summary.id)
    )
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, config.alertMaxItems)
    .map((item) => toAlertCampaign(item, config));
}

export function formatAlertEmail(payload: AlertPayload): { subject: string; text: string; html: string } {
  const count = payload.campaigns.length;
  const subject = count === 1
    ? `Clip Engine: new campaign ${payload.campaigns[0].name}`
    : `Clip Engine: ${count} new high-scoring campaigns`;
  const lines = payload.campaigns.map((campaign, index) => {
    const flags = [
      campaign.contentKind === "ugc" ? "UGC" : null,
      campaign.flagRateOverCap ? "RATE>20" : null,
      campaign.flagStaleZeroCreators ? "STALE_ZERO_CREATORS" : null,
    ].filter(Boolean).join(", ");
    return [
      `${index + 1}. ${campaign.name} — ${campaign.organizationName ?? "unknown org"}`,
      `   rate $${campaign.maxRatePer1K.toFixed(2)}/1K | remaining $${
        campaign.remainingDollars.toFixed(0)
      } | creators ${campaign.creatorCount} | score ${campaign.score.toFixed(1)}`,
      `   platforms ${campaign.platforms.join(", ") || "—"} | brands ${
        campaign.brands.join(", ") || "unmapped"
      }${flags ? ` | flags ${flags}` : ""}`,
      campaign.pageUrlHint ? `   link (TODO-verify): ${campaign.pageUrlHint}` : "",
    ].filter(Boolean).join("\n");
  });
  const text = `New high-scoring Content Rewards campaigns (${payload.generatedAt}):\n\n${
    lines.join("\n\n")
  }\n`;
  const html = `<p>New high-scoring Content Rewards campaigns (${payload.generatedAt})</p><ol>${
    payload.campaigns.map((campaign) => {
      const flags = [
        campaign.contentKind === "ugc" ? "UGC" : null,
        campaign.flagRateOverCap ? "RATE&gt;20" : null,
        campaign.flagStaleZeroCreators ? "STALE_ZERO_CREATORS" : null,
      ].filter(Boolean).join(", ");
      const link = campaign.pageUrlHint
        ? `<br/><a href="${campaign.pageUrlHint}">campaign page (TODO-verify URL)</a>`
        : "";
      return `<li><strong>${escapeHtml(campaign.name)}</strong> — ${
        escapeHtml(campaign.organizationName ?? "unknown org")
      }<br/>$${campaign.maxRatePer1K.toFixed(2)}/1K · $${
        campaign.remainingDollars.toFixed(0)
      } left · ${campaign.creatorCount} creators · score ${
        campaign.score.toFixed(1)
      }<br/>${escapeHtml(campaign.platforms.join(", ") || "—")} · ${
        escapeHtml(campaign.brands.join(", ") || "unmapped")
      }${flags ? ` · ${flags}` : ""}${link}</li>`;
    }).join("")
  }</ol>`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendAlert(
  payload: AlertPayload,
  config: ScoutConfig,
): Promise<{ sent: boolean; channel: string; error?: string }> {
  if (payload.campaigns.length === 0 || config.alertChannel === "none") {
    return { sent: false, channel: config.alertChannel };
  }

  if (config.alertChannel === "resend") {
    const url = config.alertWebhookUrl || "https://api.resend.com/emails";
    if (!config.resendApiKey || !config.alertFromEmail || !config.alertToEmail) {
      return {
        sent: false,
        channel: "resend",
        error: "RESEND_API_KEY, ALERT_FROM_EMAIL, and ALERT_TO_EMAIL are required",
      };
    }
    const email = formatAlertEmail(payload);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: config.alertFromEmail,
        to: [config.alertToEmail],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });
    if (!response.ok) {
      return {
        sent: false,
        channel: "resend",
        error: `Resend HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`,
      };
    }
    return { sent: true, channel: "resend" };
  }

  if (!config.alertWebhookUrl) {
    return { sent: false, channel: "webhook", error: "ALERT_WEBHOOK_URL is not set" };
  }
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.alertWebhookBearer) {
    headers.authorization = `Bearer ${config.alertWebhookBearer}`;
  }
  const response = await fetch(config.alertWebhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    return {
      sent: false,
      channel: "webhook",
      error: `Webhook HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`,
    };
  }
  return { sent: true, channel: "webhook" };
}
