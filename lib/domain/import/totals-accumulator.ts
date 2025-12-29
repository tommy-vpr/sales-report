// lib/domain/import/totals-accumulator.ts
import type { Platform } from "@prisma/client";
import type { ParsedCSVRow, PlatformTotals } from "./types";

export function accumulateTotals(
  map: Map<Platform, PlatformTotals>,
  row: ParsedCSVRow
) {
  if (!map.has(row.platform)) {
    map.set(row.platform, {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalVideoViews: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      campaignCount: 0,
      ctrSum: 0,
      ctrCount: 0,
      cpmSum: 0,
      cpmCount: 0,
      cpcSum: 0,
      cpcCount: 0,
      roasSum: 0,
      roasCount: 0,
    });
  }

  const t = map.get(row.platform)!;
  t.totalSpend += row.spend;
  t.totalImpressions += row.impressions;
  t.totalClicks += row.clicks ?? 0;
  t.totalVideoViews += row.videoViews ?? 0;
  t.totalPurchases += row.purchases ?? 0;
  t.totalRevenue += row.purchaseValue ?? 0;
  t.campaignCount += 1;
}
