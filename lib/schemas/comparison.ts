// lib/schemas/comparison.ts
import { z } from "zod";
import type { Platform } from "@prisma/client";

// ============ INPUT SCHEMAS ============

export const ComparisonParamsSchema = z.object({
  month1Year: z.number().int(),
  month1Month: z.number().int().min(1).max(12),
  month2Year: z.number().int(),
  month2Month: z.number().int().min(1).max(12),
});

// ============ TYPES ============

export interface PeriodTotals {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalVideoViews: number;
  totalPurchases: number;
  totalRevenue: number;
  campaignCount: number;
  avgCtr: number;
  avgCpm: number;
  avgCpc: number;
  avgRoas: number;
}

export interface PeriodData {
  date: Date;
  label: string;
  totals: PeriodTotals;
  platformCount: number;
}

export interface PlatformPeriodData {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  purchases: number;
  revenue: number;
  roas: number;
}

export interface ReportPeriod {
  year: number;
  month: number;
  label: string;
  monthName: string; // Add this
  platformCount: number;
  campaignCount: number;
  totalSpend: number;
  totalImpressions: number;
}

export interface ReportPeriodsData {
  periods: ReportPeriod[];
  years: number[]; // Add this
  totals: {
    totalSpend: number;
    totalImpressions: number;
  };
}

export interface PlatformComparison {
  platform: Platform;
  period1: PlatformPeriodData;
  period2: PlatformPeriodData;
  changes: {
    spend: number | null;
    impressions: number | null;
    clicks: number | null;
    ctr: number | null;
    purchases: number | null;
    revenue: number | null;
    roas: number | null;
  };
}

export interface ComparisonChanges {
  totalSpend: number | null;
  totalImpressions: number | null;
  totalClicks: number | null;
  totalPurchases: number | null;
  totalRevenue: number | null;
  avgCtr: number | null;
  avgCpm: number | null;
  avgCpc: number | null;
  avgRoas: number | null;
}

export interface ComparisonData {
  period1: PeriodData;
  period2: PeriodData;
  changes: ComparisonChanges;
  platformComparison: PlatformComparison[];
}

// ============ INFERRED TYPES ============

export type ComparisonParams = z.infer<typeof ComparisonParamsSchema>;
