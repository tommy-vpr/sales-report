// hooks/use-comparison.ts
import { useQuery } from "@tanstack/react-query";

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
  date: string;
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

export interface PlatformComparison {
  platform: string;
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

export interface ComparisonResponse {
  success: boolean;
  data: {
    period1: PeriodData;
    period2: PeriodData;
    changes: ComparisonChanges;
    platformComparison: PlatformComparison[];
  };
}

export interface ComparisonParams {
  month1Year: number;
  month1Month: number;
  month2Year: number;
  month2Month: number;
}

// ============ FETCH FUNCTION ============

async function fetchComparison(
  params: ComparisonParams
): Promise<ComparisonResponse> {
  const searchParams = new URLSearchParams({
    month1Year: params.month1Year.toString(),
    month1Month: params.month1Month.toString(),
    month2Year: params.month2Year.toString(),
    month2Month: params.month2Month.toString(),
  });

  const response = await fetch(`/api/compare?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch comparison data");
  }

  return response.json();
}

// ============ HOOK ============

export function useComparison(params: ComparisonParams | null) {
  return useQuery({
    queryKey: ["comparison", params],
    queryFn: () => fetchComparison(params!),
    enabled: !!params,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
