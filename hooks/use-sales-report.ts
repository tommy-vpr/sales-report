// hooks/use-sales-report.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardOverview,
  getPlatformBreakdown,
  getRegionalBreakdown,
  getTrendAnalysis,
  getCampaignPerformance,
  getTopPerformers,
  getReport,
  getAvailableFilters,
  getMonthlySummaries,
  getComparisonData,
} from "@/lib/actions/sales-report";
import type {
  GetPlatformOverviewInput,
  GetRegionalBreakdownInput,
  GetTrendAnalysisInput,
  GetCampaignPerformanceInput,
  GetTopPerformersInput,
  GetReportInput,
  DateRange,
} from "@/lib/schemas/sales-report";

// ============ QUERY KEYS ============

export const salesReportKeys = {
  all: ["salesReport"] as const,

  // Dashboard
  dashboard: (dateRange: DateRange, compareWith?: DateRange) =>
    [...salesReportKeys.all, "dashboard", dateRange, compareWith] as const,

  // Platform breakdown
  platforms: (dateRange: DateRange) =>
    [...salesReportKeys.all, "platforms", dateRange] as const,

  // Regional
  regions: (input: GetRegionalBreakdownInput) =>
    [...salesReportKeys.all, "regions", input] as const,

  // Trends
  trends: (input: GetTrendAnalysisInput) =>
    [...salesReportKeys.all, "trends", input] as const,

  // Campaigns
  campaigns: () => [...salesReportKeys.all, "campaigns"] as const,
  campaignPerformance: (input: GetCampaignPerformanceInput) =>
    [...salesReportKeys.all, "campaignPerformance", input] as const,

  // Top performers
  topPerformers: (input: GetTopPerformersInput) =>
    [...salesReportKeys.all, "topPerformers", input] as const,

  // Report (paginated)
  report: (input: GetReportInput) =>
    [...salesReportKeys.all, "report", input] as const,

  // Filters
  filters: () => [...salesReportKeys.all, "filters"] as const,

  // Monthly summaries
  monthlySummaries: (year: number) =>
    [...salesReportKeys.all, "monthlySummaries", year] as const,

  // Comparison
  comparison: (currentPeriod: DateRange, previousPeriod: DateRange) =>
    [
      ...salesReportKeys.all,
      "comparison",
      currentPeriod,
      previousPeriod,
    ] as const,
};

// ============ DASHBOARD HOOKS ============

export function useDashboardOverview(input: GetPlatformOverviewInput) {
  return useQuery({
    queryKey: salesReportKeys.dashboard(input.dateRange, input.compareWith),
    queryFn: () => getDashboardOverview(input),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlatformBreakdown(dateRange: DateRange) {
  return useQuery({
    queryKey: salesReportKeys.platforms(dateRange),
    queryFn: () => getPlatformBreakdown(dateRange),
    staleTime: 5 * 60 * 1000,
  });
}

// ============ REGIONAL HOOKS ============

export function useRegionalBreakdown(input: GetRegionalBreakdownInput) {
  return useQuery({
    queryKey: salesReportKeys.regions(input),
    queryFn: () => getRegionalBreakdown(input),
    staleTime: 5 * 60 * 1000,
  });
}

// ============ TREND HOOKS ============

export function useTrendAnalysis(input: GetTrendAnalysisInput) {
  return useQuery({
    queryKey: salesReportKeys.trends(input),
    queryFn: () => getTrendAnalysis(input),
    staleTime: 5 * 60 * 1000,
  });
}

// ============ CAMPAIGN HOOKS ============

export function useCampaignPerformance(input: GetCampaignPerformanceInput) {
  return useQuery({
    queryKey: salesReportKeys.campaignPerformance(input),
    queryFn: () => getCampaignPerformance(input),
    staleTime: 5 * 60 * 1000,
    enabled: !!input.dateRange,
  });
}

// ============ TOP PERFORMERS HOOKS ============

export function useTopPerformers(input: GetTopPerformersInput) {
  return useQuery({
    queryKey: salesReportKeys.topPerformers(input),
    queryFn: () => getTopPerformers(input),
    staleTime: 5 * 60 * 1000,
  });
}

// ============ REPORT HOOKS ============

export function useReport(input: GetReportInput) {
  return useQuery({
    queryKey: salesReportKeys.report(input),
    queryFn: () => getReport(input),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
}

// ============ FILTER HOOKS ============

export function useAvailableFilters() {
  return useQuery({
    queryKey: salesReportKeys.filters(),
    queryFn: () => getAvailableFilters(),
    staleTime: 30 * 60 * 1000, // 30 minutes - filters don't change often
  });
}

// ============ MONTHLY SUMMARY HOOKS ============

export function useMonthlySummaries(year: number) {
  return useQuery({
    queryKey: salesReportKeys.monthlySummaries(year),
    queryFn: () => getMonthlySummaries({ year }),
    staleTime: 10 * 60 * 1000,
  });
}

// ============ COMPARISON HOOKS ============

export function useComparisonData(
  currentPeriod: DateRange,
  previousPeriod: DateRange
) {
  return useQuery({
    queryKey: salesReportKeys.comparison(currentPeriod, previousPeriod),
    queryFn: () => getComparisonData({ currentPeriod, previousPeriod }),
    staleTime: 5 * 60 * 1000,
    enabled: !!(currentPeriod && previousPeriod),
  });
}

// ============ PREFETCH HELPERS ============

export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return async (input: GetPlatformOverviewInput) => {
    await queryClient.prefetchQuery({
      queryKey: salesReportKeys.dashboard(input.dateRange, input.compareWith),
      queryFn: () => getDashboardOverview(input),
      staleTime: 5 * 60 * 1000,
    });
  };
}

// ============ INVALIDATION HELPERS ============

export function useInvalidateSalesReport() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: salesReportKeys.all });
    },
    invalidateDashboard: () => {
      queryClient.invalidateQueries({
        queryKey: [...salesReportKeys.all, "dashboard"],
      });
    },
    invalidateReport: () => {
      queryClient.invalidateQueries({
        queryKey: [...salesReportKeys.all, "report"],
      });
    },
    invalidateCampaigns: () => {
      queryClient.invalidateQueries({
        queryKey: salesReportKeys.campaigns(),
      });
    },
  };
}
