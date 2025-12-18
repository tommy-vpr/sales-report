// lib/services/comparison.service.ts
import type { MonthlySummary, Platform } from "@prisma/client";
import { comparisonRepository } from "@/lib/repositories/comparison.repository";
import type {
  ComparisonParams,
  ComparisonData,
  PeriodTotals,
  PlatformComparison,
  PlatformPeriodData,
} from "@/lib/schemas/comparison";

// ============ HELPERS ============

function calculateTotals(data: MonthlySummary[]): PeriodTotals {
  const totals = data.reduce(
    (acc, s) => ({
      totalSpend: acc.totalSpend + Number(s.totalSpend),
      totalImpressions: acc.totalImpressions + Number(s.totalImpressions),
      totalClicks: acc.totalClicks + Number(s.totalClicks || 0),
      totalVideoViews: acc.totalVideoViews + Number(s.totalVideoViews || 0),
      totalPurchases: acc.totalPurchases + Number(s.totalPurchases || 0),
      totalRevenue: acc.totalRevenue + Number(s.totalRevenue || 0),
      campaignCount: acc.campaignCount + Number(s.campaignCount),
    }),
    {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalVideoViews: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      campaignCount: 0,
    }
  );

  return {
    ...totals,
    avgCtr:
      totals.totalImpressions > 0
        ? totals.totalClicks / totals.totalImpressions
        : 0,
    avgCpm:
      totals.totalImpressions > 0
        ? (totals.totalSpend / totals.totalImpressions) * 1000
        : 0,
    avgCpc: totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0,
    avgRoas:
      totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0,
  };
}

function calculateChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function formatPeriodLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function buildPlatformComparison(
  period1Data: MonthlySummary[],
  period2Data: MonthlySummary[]
): PlatformComparison[] {
  const allPlatforms = new Set([
    ...period1Data.map((d) => d.platform),
    ...period2Data.map((d) => d.platform),
  ]);

  return Array.from(allPlatforms)
    .map((platform) => {
      const p1 = period1Data.find((d) => d.platform === platform);
      const p2 = period2Data.find((d) => d.platform === platform);

      const p1Data = extractPlatformData(p1);
      const p2Data = extractPlatformData(p2);

      return {
        platform,
        period1: p1Data,
        period2: p2Data,
        changes: {
          spend: calculateChange(p2Data.spend, p1Data.spend),
          impressions: calculateChange(p2Data.impressions, p1Data.impressions),
          clicks: calculateChange(p2Data.clicks, p1Data.clicks),
          ctr: calculateChange(p2Data.ctr, p1Data.ctr),
          purchases: calculateChange(p2Data.purchases, p1Data.purchases),
          revenue: calculateChange(p2Data.revenue, p1Data.revenue),
          roas: calculateChange(p2Data.roas, p1Data.roas),
        },
      };
    })
    .sort((a, b) => b.period2.spend - a.period2.spend);
}

function extractPlatformData(
  summary: MonthlySummary | undefined
): PlatformPeriodData {
  if (!summary) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpm: 0,
      purchases: 0,
      revenue: 0,
      roas: 0,
    };
  }

  const spend = Number(summary.totalSpend);
  const impressions = Number(summary.totalImpressions);
  const clicks = Number(summary.totalClicks || 0);

  return {
    spend,
    impressions,
    clicks,
    ctr: Number(summary.avgCtr || 0),
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    purchases: Number(summary.totalPurchases || 0),
    revenue: Number(summary.totalRevenue || 0),
    roas: Number(summary.avgRoas || 0),
  };
}

// ============ SERVICE ============

export const comparisonService = {
  async getComparison(params: ComparisonParams): Promise<ComparisonData> {
    const { month1Year, month1Month, month2Year, month2Month } = params;

    const period1Date = new Date(month1Year, month1Month - 1, 1);
    const period2Date = new Date(month2Year, month2Month - 1, 1);

    const [period1Data, period2Data] = await Promise.all([
      comparisonRepository.findMonthlySummariesByMonth(period1Date),
      comparisonRepository.findMonthlySummariesByMonth(period2Date),
    ]);

    const period1Totals = calculateTotals(period1Data);
    const period2Totals = calculateTotals(period2Data);

    const changes = {
      totalSpend: calculateChange(
        period2Totals.totalSpend,
        period1Totals.totalSpend
      ),
      totalImpressions: calculateChange(
        period2Totals.totalImpressions,
        period1Totals.totalImpressions
      ),
      totalClicks: calculateChange(
        period2Totals.totalClicks,
        period1Totals.totalClicks
      ),
      totalPurchases: calculateChange(
        period2Totals.totalPurchases,
        period1Totals.totalPurchases
      ),
      totalRevenue: calculateChange(
        period2Totals.totalRevenue,
        period1Totals.totalRevenue
      ),
      avgCtr: calculateChange(period2Totals.avgCtr, period1Totals.avgCtr),
      avgCpm: calculateChange(period2Totals.avgCpm, period1Totals.avgCpm),
      avgCpc: calculateChange(period2Totals.avgCpc, period1Totals.avgCpc),
      avgRoas: calculateChange(period2Totals.avgRoas, period1Totals.avgRoas),
    };

    const platformComparison = buildPlatformComparison(
      period1Data,
      period2Data
    );

    return {
      period1: {
        date: period1Date,
        label: formatPeriodLabel(period1Date),
        totals: period1Totals,
        platformCount: period1Data.length,
      },
      period2: {
        date: period2Date,
        label: formatPeriodLabel(period2Date),
        totals: period2Totals,
        platformCount: period2Data.length,
      },
      changes,
      platformComparison,
    };
  },
};
