// lib/schemas/monthly-summary.ts
import { z } from "zod";
import { PlatformSchema } from "./sales-report";

// ============ INPUT SCHEMAS (for validation) ============

export const MonthlySummaryFiltersSchema = z.object({
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  platform: PlatformSchema.optional(), // Use the enum schema
  startYear: z.number().int().optional(),
  startMonth: z.number().int().min(1).max(12).optional(),
  endYear: z.number().int().optional(),
  endMonth: z.number().int().min(1).max(12).optional(),
});
// ============ OUTPUT TYPES ============

export interface MonthlySummaryItem {
  id: string;
  platform: string;
  month: Date;
  monthName: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  avgCtr: number;
  avgCpm: number;
  avgCpc: number;
  totalVideoViews: number;
  totalPurchases: number;
  totalRevenue: number;
  avgRoas: number;
  campaignCount: number;
}

export interface PlatformBreakdown {
  platform: string;
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
  spendShare: number;
  months: {
    month: Date;
    monthName: string;
    spend: number;
    impressions: number;
    clicks: number;
    purchases: number;
    revenue: number;
  }[];
}

export interface MonthlyTrend {
  month: Date;
  monthName: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalPurchases: number;
  totalRevenue: number;
  platforms: string[];
}

export interface MonthlySummaryTotals {
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

export interface MonthlySummaryData {
  summaries: MonthlySummaryItem[];
  totals: MonthlySummaryTotals;
  platformBreakdown: PlatformBreakdown[];
  monthlyTrend: MonthlyTrend[];
}

// ============ INFERRED TYPES ============

export type MonthlySummaryFilters = z.infer<typeof MonthlySummaryFiltersSchema>;
