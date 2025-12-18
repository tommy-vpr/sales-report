// lib/schemas/import.ts
import { z } from "zod";
import type { Platform } from "@prisma/client";

// ============ INPUT SCHEMAS ============

export const ImportCSVInputSchema = z.object({
  fileContent: z.string(),
  fileName: z.string(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export const GetReportPeriodsInputSchema = z.object({}).optional();

// ============ TYPES ============

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

export interface ImportPeriod {
  year: number;
  month: number;
}

export interface PlatformTotals {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
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

export interface ImportResult {
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  records: {
    created: number;
    updated: number;
    total: number;
  };
  summaries: {
    platforms: string[];
    count: number;
  };
}

export interface ReportPeriod {
  year: number;
  month: number;
  label: string;
  monthName: string; // <-- Added
  platformCount: number;
  campaignCount: number;
  totalSpend: number;
  totalImpressions: number;
}

export interface ReportPeriodsData {
  periods: ReportPeriod[];
  years: number[]; // <-- Added
  totals: {
    totalSpend: number;
    totalImpressions: number;
  };
}

// ============ INFERRED TYPES ============

export type ImportCSVInput = z.infer<typeof ImportCSVInputSchema>;
