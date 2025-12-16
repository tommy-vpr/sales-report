// lib/actions/sales-report.ts
"use server";

import { z } from "zod";
import { createAction } from "./utils";
import {
  GetPlatformOverviewSchema,
  GetCampaignPerformanceSchema,
  GetRegionalBreakdownSchema,
  GetTopPerformersSchema,
  GetTrendAnalysisSchema,
  GetReportInputSchema,
  DateRangeSchema,
} from "@/lib/schemas/sales-report";
import { salesReportService } from "@/services/sales-report.service";

// ============ DASHBOARD ============

export const getDashboardOverview = createAction({
  schema: GetPlatformOverviewSchema,
  handler: (input) => salesReportService.getDashboardOverview(input),
});

export const getPlatformBreakdown = createAction({
  schema: DateRangeSchema,
  handler: (input) => salesReportService.getPlatformBreakdown(input),
});

// ============ REGIONAL ============

export const getRegionalBreakdown = createAction({
  schema: GetRegionalBreakdownSchema,
  handler: (input) => salesReportService.getRegionalBreakdown(input),
});

// ============ TRENDS ============

export const getTrendAnalysis = createAction({
  schema: GetTrendAnalysisSchema,
  handler: (input) => salesReportService.getMetricTrend(input),
});

// ============ CAMPAIGNS ============

export const getCampaignPerformance = createAction({
  schema: GetCampaignPerformanceSchema,
  handler: (input) => salesReportService.getCampaignPerformance(input),
});

// ============ TOP PERFORMERS ============

export const getTopPerformers = createAction({
  schema: GetTopPerformersSchema,
  handler: (input) => salesReportService.getTopPerformers(input),
});

// ============ PAGINATED REPORT ============

export const getReport = createAction({
  schema: GetReportInputSchema,
  handler: (input) => salesReportService.getReport(input),
});

// ============ FILTERS ============

export async function getAvailableFilters() {
  return salesReportService.getAvailableFilters();
}

// ============ MONTHLY SUMMARIES ============

export const getMonthlySummaries = createAction({
  schema: z.object({ year: z.number().int() }),
  handler: ({ year }) => salesReportService.getMonthlySummaries(year),
});

// ============ COMPARISON HELPERS ============

export const getComparisonData = createAction({
  schema: z.object({
    currentPeriod: DateRangeSchema,
    previousPeriod: DateRangeSchema,
  }),
  handler: async ({ currentPeriod, previousPeriod }) => {
    const [current, previous] = await Promise.all([
      salesReportService.getDashboardOverview({ dateRange: currentPeriod }),
      salesReportService.getDashboardOverview({ dateRange: previousPeriod }),
    ]);

    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      current,
      previous,
      changes: {
        spend: calculateChange(current.totalSpend, previous.totalSpend),
        impressions: calculateChange(
          current.totalImpressions,
          previous.totalImpressions
        ),
        clicks: calculateChange(current.totalClicks, previous.totalClicks),
        ctr: calculateChange(current.avgCtr, previous.avgCtr),
        cpm: calculateChange(current.avgCpm, previous.avgCpm),
        purchases: calculateChange(
          current.totalPurchases,
          previous.totalPurchases
        ),
        revenue: calculateChange(current.totalRevenue, previous.totalRevenue),
        roas: calculateChange(current.avgRoas, previous.avgRoas),
      },
    };
  },
});
