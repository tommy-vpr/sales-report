// app/api/reports/compare/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get comparison periods
    const month1Year = searchParams.get("month1Year");
    const month1Month = searchParams.get("month1Month");
    const month2Year = searchParams.get("month2Year");
    const month2Month = searchParams.get("month2Month");

    if (!month1Year || !month1Month || !month2Year || !month2Month) {
      return NextResponse.json(
        { error: "Both comparison periods are required" },
        { status: 400 }
      );
    }

    const period1Date = new Date(
      parseInt(month1Year),
      parseInt(month1Month) - 1,
      1
    );
    const period2Date = new Date(
      parseInt(month2Year),
      parseInt(month2Month) - 1,
      1
    );

    // Fetch summaries for both periods
    const [period1Data, period2Data] = await Promise.all([
      prisma.monthlySummary.findMany({
        where: { month: period1Date },
        orderBy: { totalSpend: "desc" },
      }),
      prisma.monthlySummary.findMany({
        where: { month: period2Date },
        orderBy: { totalSpend: "desc" },
      }),
    ]);

    // Calculate totals for each period
    const calculateTotals = (data: typeof period1Data) => {
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
        avgCpc:
          totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0,
        avgRoas:
          totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0,
      };
    };

    const period1Totals = calculateTotals(period1Data);
    const period2Totals = calculateTotals(period2Data);

    // Calculate changes
    const calculateChange = (
      current: number,
      previous: number
    ): number | null => {
      if (previous === 0) return current > 0 ? 100 : null;
      return ((current - previous) / previous) * 100;
    };

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

    // Platform comparison
    const allPlatforms = new Set([
      ...period1Data.map((d) => d.platform),
      ...period2Data.map((d) => d.platform),
    ]);

    const platformComparison = Array.from(allPlatforms).map((platform) => {
      const p1 = period1Data.find((d) => d.platform === platform);
      const p2 = period2Data.find((d) => d.platform === platform);

      const p1Spend = Number(p1?.totalSpend || 0);
      const p2Spend = Number(p2?.totalSpend || 0);
      const p1Impressions = Number(p1?.totalImpressions || 0);
      const p2Impressions = Number(p2?.totalImpressions || 0);
      const p1Clicks = Number(p1?.totalClicks || 0);
      const p2Clicks = Number(p2?.totalClicks || 0);
      const p1Ctr = Number(p1?.avgCtr || 0);
      const p2Ctr = Number(p2?.avgCtr || 0);
      const p1Purchases = Number(p1?.totalPurchases || 0);
      const p2Purchases = Number(p2?.totalPurchases || 0);
      const p1Revenue = Number(p1?.totalRevenue || 0);
      const p2Revenue = Number(p2?.totalRevenue || 0);
      const p1Roas = Number(p1?.avgRoas || 0);
      const p2Roas = Number(p2?.avgRoas || 0);

      return {
        platform,
        period1: {
          spend: p1Spend,
          impressions: p1Impressions,
          clicks: p1Clicks,
          ctr: p1Ctr,
          cpm: p1Impressions > 0 ? (p1Spend / p1Impressions) * 1000 : 0,
          purchases: p1Purchases,
          revenue: p1Revenue,
          roas: p1Roas,
        },
        period2: {
          spend: p2Spend,
          impressions: p2Impressions,
          clicks: p2Clicks,
          ctr: p2Ctr,
          cpm: p2Impressions > 0 ? (p2Spend / p2Impressions) * 1000 : 0,
          purchases: p2Purchases,
          revenue: p2Revenue,
          roas: p2Roas,
        },
        changes: {
          spend: calculateChange(p2Spend, p1Spend),
          impressions: calculateChange(p2Impressions, p1Impressions),
          clicks: calculateChange(p2Clicks, p1Clicks),
          ctr: calculateChange(p2Ctr, p1Ctr),
          purchases: calculateChange(p2Purchases, p1Purchases),
          revenue: calculateChange(p2Revenue, p1Revenue),
          roas: calculateChange(p2Roas, p1Roas),
        },
      };
    });

    // Format period labels
    const formatPeriod = (date: Date) =>
      date.toLocaleString("en-US", { month: "long", year: "numeric" });

    return NextResponse.json({
      success: true,
      data: {
        period1: {
          date: period1Date,
          label: formatPeriod(period1Date),
          totals: period1Totals,
          platformCount: period1Data.length,
        },
        period2: {
          date: period2Date,
          label: formatPeriod(period2Date),
          totals: period2Totals,
          platformCount: period2Data.length,
        },
        changes,
        platformComparison: platformComparison.sort(
          (a, b) => b.period2.spend - a.period2.spend
        ),
      },
    });
  } catch (error) {
    console.error("Error comparing periods:", error);
    return NextResponse.json(
      { error: "Failed to compare periods" },
      { status: 500 }
    );
  }
}
