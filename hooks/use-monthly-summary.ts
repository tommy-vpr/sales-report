// hooks/use-monthly-summary.ts
import { useQuery } from "@tanstack/react-query";

// ============ TYPES ============

export interface MonthlySummaryItem {
  id: string;
  platform: string;
  month: string;
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
    month: string;
    monthName: string;
    spend: number;
    impressions: number;
    clicks: number;
    purchases: number;
    revenue: number;
  }[];
}

export interface MonthlyTrend {
  month: string;
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

export interface MonthlySummaryResponse {
  success: boolean;
  data: {
    summaries: MonthlySummaryItem[];
    totals: MonthlySummaryTotals;
    platformBreakdown: PlatformBreakdown[];
    monthlyTrend: MonthlyTrend[];
  };
}

export interface MonthlySummaryFilters {
  year?: number;
  month?: number;
  platform?: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}

// ============ FETCH FUNCTION ============

async function fetchMonthlySummary(
  filters: MonthlySummaryFilters
): Promise<MonthlySummaryResponse> {
  const params = new URLSearchParams();

  if (filters.year) params.set("year", filters.year.toString());
  if (filters.month) params.set("month", filters.month.toString());
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.startYear) params.set("startYear", filters.startYear.toString());
  if (filters.startMonth)
    params.set("startMonth", filters.startMonth.toString());
  if (filters.endYear) params.set("endYear", filters.endYear.toString());
  if (filters.endMonth) params.set("endMonth", filters.endMonth.toString());

  const url = `/api/monthly-summary${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch monthly summary");
  }

  return response.json();
}

// ============ HOOK ============

export function useMonthlySummary(filters: MonthlySummaryFilters = {}) {
  return useQuery({
    queryKey: ["monthlySummary", filters],
    queryFn: () => fetchMonthlySummary(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
