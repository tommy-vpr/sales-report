// lib/services/monthly-summary.service.ts
import type {
  MonthlySummaryFilters,
  MonthlySummaryItem,
  MonthlySummaryData,
  PlatformBreakdown,
  MonthlyTrend,
  MonthlySummaryTotals,
} from "@/lib/schemas/monthly-summary";
import { monthlySummaryRepository } from "../repositories/monthly-summary.repository";

export const monthlySummaryService = {
  async getMonthlySummary(
    filters: MonthlySummaryFilters
  ): Promise<MonthlySummaryData> {
    const summaries = await monthlySummaryRepository.findMany(filters);

    // Transform raw data
    const data = summaries.map((s) => ({
      id: s.id,
      platform: s.platform,
      month: s.month,
      monthName: s.month.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      totalSpend: Number(s.totalSpend),
      totalImpressions: Number(s.totalImpressions),
      totalClicks: Number(s.totalClicks) || 0,
      totalReach: Number(s.totalReach) || 0,
      avgCtr: Number(s.avgCtr) || 0,
      avgCpm: Number(s.avgCpm) || 0,
      avgCpc: Number(s.avgCpc) || 0,
      totalVideoViews: Number(s.totalVideoViews) || 0,
      totalPurchases: Number(s.totalPurchases) || 0,
      totalRevenue: Number(s.totalRevenue) || 0,
      avgRoas: Number(s.avgRoas) || 0,
      campaignCount: Number(s.campaignCount),
    }));

    const totals = this.calculateTotals(data);
    const platformBreakdown = this.groupByPlatform(data, totals.totalSpend);
    const monthlyTrend = this.groupByMonth(data);

    return { summaries: data, totals, platformBreakdown, monthlyTrend };
  },

  calculateTotals(data: MonthlySummaryItem[]): MonthlySummaryTotals {
    const totals = data.reduce(
      (acc, s) => ({
        totalSpend: acc.totalSpend + s.totalSpend,
        totalImpressions: acc.totalImpressions + s.totalImpressions,
        totalClicks: acc.totalClicks + s.totalClicks,
        totalVideoViews: acc.totalVideoViews + s.totalVideoViews,
        totalPurchases: acc.totalPurchases + s.totalPurchases,
        totalRevenue: acc.totalRevenue + s.totalRevenue,
        campaignCount: acc.campaignCount + s.campaignCount,
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
      avgCpc:
        totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0,
      avgRoas:
        totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0,
    };
  },

  groupByPlatform(
    data: MonthlySummaryItem[],
    totalSpend: number
  ): PlatformBreakdown[] {
    const byPlatform = data.reduce<Record<string, PlatformBreakdown>>(
      (acc, s) => {
        if (!acc[s.platform]) {
          acc[s.platform] = {
            platform: s.platform,
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalVideoViews: 0,
            totalPurchases: 0,
            totalRevenue: 0,
            campaignCount: 0,
            avgCtr: 0,
            avgCpm: 0,
            avgCpc: 0,
            avgRoas: 0,
            spendShare: 0,
            months: [],
          };
        }

        const p = acc[s.platform];
        p.totalSpend += s.totalSpend;
        p.totalImpressions += s.totalImpressions;
        p.totalClicks += s.totalClicks;
        p.totalVideoViews += s.totalVideoViews;
        p.totalPurchases += s.totalPurchases;
        p.totalRevenue += s.totalRevenue;
        p.campaignCount += s.campaignCount;
        p.months.push({
          month: s.month,
          monthName: s.monthName,
          spend: s.totalSpend,
          impressions: s.totalImpressions,
          clicks: s.totalClicks,
          purchases: s.totalPurchases,
          revenue: s.totalRevenue,
        });

        return acc;
      },
      {}
    );

    return Object.values(byPlatform)
      .map((p) => ({
        ...p,
        avgCtr: p.totalImpressions > 0 ? p.totalClicks / p.totalImpressions : 0,
        avgCpm:
          p.totalImpressions > 0
            ? (p.totalSpend / p.totalImpressions) * 1000
            : 0,
        avgCpc: p.totalClicks > 0 ? p.totalSpend / p.totalClicks : 0,
        avgRoas: p.totalSpend > 0 ? p.totalRevenue / p.totalSpend : 0,
        spendShare: totalSpend > 0 ? (p.totalSpend / totalSpend) * 100 : 0,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);
  },

  groupByMonth(data: MonthlySummaryItem[]): MonthlyTrend[] {
    const byMonth = data.reduce<Record<string, MonthlyTrend>>((acc, s) => {
      const key = s.month.toISOString();
      if (!acc[key]) {
        acc[key] = {
          month: s.month,
          monthName: s.monthName,
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalPurchases: 0,
          totalRevenue: 0,
          platforms: [],
        };
      }

      acc[key].totalSpend += s.totalSpend;
      acc[key].totalImpressions += s.totalImpressions;
      acc[key].totalClicks += s.totalClicks;
      acc[key].totalPurchases += s.totalPurchases;
      acc[key].totalRevenue += s.totalRevenue;
      acc[key].platforms.push(s.platform);

      return acc;
    }, {});

    return Object.values(byMonth).sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  },
};
