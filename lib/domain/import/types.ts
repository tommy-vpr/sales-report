// lib/domain/import/types.ts
import type { Platform } from "@prisma/client";

/**
 * DOMAIN row — includes platform
 * Used ONLY in domain logic
 */
export interface ParsedCSVRow {
  platform: Platform;

  impressions: number;
  clicks: number | null;
  spend: number;

  ctr: number | null;
  cpm: number | null;
  cpc: number | null;

  videoViews: number | null;
  videoViewRate: number | null;

  purchases: number | null;
  purchaseValue: number | null;
  roas: number | null;
}

/**
 * PERSISTENCE-SAFE metrics
 * This is the ONLY shape allowed to hit Prisma
 */
export type CampaignMetricData = Omit<ParsedCSVRow, "platform">;

export interface ImportPeriod {
  year: number;
  month: number;
}

export interface PlatformTotals {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalVideoViews: number;
  totalPurchases: number;
  totalRevenue: number;

  campaignCount: number;

  ctrSum: number;
  ctrCount: number;
  cpmSum: number;
  cpmCount: number;
  cpcSum: number;
  cpcCount: number;
  roasSum: number;
  roasCount: number;
}
