// lib/domain/import/row-transformer.ts
import { PLATFORM_MAP } from "./platform-map";
import type { ParsedCSVRow } from "./types";

function parseNumber(value?: string | null): number | null {
  if (!value || value === "-" || value === "") return null;
  const cleaned = value.replace(/[$,%\s"]/g, "").replace(/,/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function transformRow(row: Record<string, string>): ParsedCSVRow | null {
  const platform = PLATFORM_MAP[row.Platform];
  if (!platform) return null;

  const impressions = parseNumber(row.Impressions);
  if (!impressions) return null;

  const spend = parseNumber(row.Cost) ?? 0;
  const clicks = parseNumber(row.Clicks);

  return {
    platform,
    impressions,
    clicks,
    spend,

    ctr: null,
    cpm: null,
    cpc: null,

    videoViews: parseNumber(row["Video Views"]),
    videoViewRate: parseNumber(row["Video View Rate"]),
    purchases: parseNumber(row.Purchases),
    purchaseValue: parseNumber(row["Purchase Value"]),
    roas: parseNumber(row.ROAS),
  };
}
