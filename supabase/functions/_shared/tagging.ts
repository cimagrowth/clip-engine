import type { BrandKey, TagResult, WhopCampaignSummary } from "./types.ts";

const UGC_PHRASES = [
  "long-form ugc",
  "long form ugc",
  "talking-head ugc",
  "talking head ugc",
  "talking-head",
  "talking head",
  "split-screen ugc",
  "split screen ugc",
  "split-screen",
  "split screen",
  "film yourself",
  "on-camera",
  "on camera",
];

/** Longer phrases first so "talking-head ugc" wins over a later standalone "ugc". */
const UGC_STANDALONE = /\bugc\b/i;

export interface NicheRule {
  brand: BrandKey;
  niche: string;
  keywords: string[];
}

export const NICHE_RULES: NicheRule[] = [
  {
    brand: "clipworthy",
    niche: "entertainment",
    keywords: [
      "entertainment",
      "streamer",
      "streamers",
      "streaming",
      "twitch",
      "podcast",
      "podcasts",
      "pop culture",
      "popculture",
      "celebrity",
      "celebrities",
      "celeb",
      "hollywood",
    ],
  },
  {
    brand: "founder_minute",
    niche: "business",
    keywords: [
      "business",
      "finance",
      "financial",
      "personal brand",
      "personal branding",
      "founder",
      "founders",
      "entrepreneur",
      "entrepreneurship",
      "investing",
      "investor",
      "money",
      "startup",
      "startups",
      "venture",
    ],
  },
  {
    brand: "hook_on_repeat",
    niche: "music",
    keywords: [
      "music",
      "artist",
      "song",
      "songs",
      "album",
      "concert",
      "rap",
      "hip hop",
      "hip-hop",
      "lyric",
      "lyrics",
      "musician",
      "dj",
      "band",
    ],
  },
  {
    brand: "dub_daily",
    niche: "gaming",
    keywords: [
      "gaming",
      "gamer",
      "gamers",
      "game",
      "games",
      "roblox",
      "fortnite",
      "call of duty",
      "callofduty",
      "cod",
      "valorant",
      "league of legends",
      "esports",
      "e-sports",
      "minecraft",
      "warzone",
    ],
  },
];

function haystack(summary: WhopCampaignSummary): string {
  const categories = (summary.categories ?? [])
    .map((category) => category.name ?? "")
    .join(" ");
  return `${summary.name ?? ""} ${summary.description ?? ""} ${categories}`
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordMatches(text: string, keyword: string): boolean {
  const normalized = keyword.toLowerCase();
  if (normalized.includes(" ")) {
    return text.includes(normalized);
  }
  const pattern = new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i");
  return pattern.test(text);
}

export function detectUgc(summary: WhopCampaignSummary): string[] {
  const text = haystack(summary);
  const matched: string[] = [];
  for (const phrase of UGC_PHRASES) {
    if (text.includes(phrase)) matched.push(phrase);
  }
  if (UGC_STANDALONE.test(text) && !matched.some((term) => term.includes("ugc"))) {
    matched.push("ugc");
  }
  return matched;
}

export function mapNichesAndBrands(
  summary: WhopCampaignSummary,
): { niches: string[]; brands: BrandKey[] } {
  const text = haystack(summary);
  const niches: string[] = [];
  const brands: BrandKey[] = [];
  for (const rule of NICHE_RULES) {
    if (rule.keywords.some((keyword) => keywordMatches(text, keyword))) {
      if (!niches.includes(rule.niche)) niches.push(rule.niche);
      if (!brands.includes(rule.brand)) brands.push(rule.brand);
    }
  }
  return { niches, brands };
}

export function tagCampaign(summary: WhopCampaignSummary): TagResult {
  const ugcMatchedTerms = detectUgc(summary);
  const { niches, brands } = mapNichesAndBrands(summary);
  return {
    contentKind: ugcMatchedTerms.length > 0 ? "ugc" : "clipping",
    niches,
    brands,
    ugcMatchedTerms,
  };
}
