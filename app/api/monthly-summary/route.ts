// app/api/monthly-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Group by platform
interface PlatformAccumulator {
  platform: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalVideoViews: number;
  totalPurchases: number;
  totalRevenue: number;
  campaignCount: number;
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

// Group by month
interface MonthAccumulator {
  month: Date;
  monthName: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalPurchases: number;
  totalRevenue: number;
  platforms: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const platform = searchParams.get("platform");
    const startYear = searchParams.get("startYear");
    const startMonth = searchParams.get("startMonth");
    const endYear = searchParams.get("endYear");
    const endMonth = searchParams.get("endMonth");

    // Build where clause
    const where: Record<string, unknown> = {};

    // Date range filtering
    if (startYear && startMonth && endYear && endMonth) {
      const startDate = new Date(
        parseInt(startYear),
        parseInt(startMonth) - 1,
        1
      );
      const endDate = new Date(parseInt(endYear), parseInt(endMonth), 0); // Last day of end month
      where.month = {
        gte: startDate,
        lte: endDate,
      };
    } else if (year && month) {
      where.month = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else if (year) {
      where.month = {
        gte: new Date(parseInt(year), 0, 1),
        lte: new Date(parseInt(year), 11, 31),
      };
    }

    if (platform) {
      where.platform = platform;
    }

    const summaries = await prisma.monthlySummary.findMany({
      where,
      orderBy: [{ month: "desc" }, { platform: "asc" }],
    });

    // Convert Decimal/BigInt to numbers
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

    // Calculate totals
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

    // Calculate overall averages
    const avgCtr =
      totals.totalImpressions > 0
        ? totals.totalClicks / totals.totalImpressions
        : 0;
    const avgCpm =
      totals.totalImpressions > 0
        ? (totals.totalSpend / totals.totalImpressions) * 1000
        : 0;
    const avgCpc =
      totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0;
    const avgRoas =
      totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0;

    // Group by platform for breakdown
    const byPlatform = data.reduce<Record<string, PlatformAccumulator>>(
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
            months: [],
          };
        }
        acc[s.platform].totalSpend += s.totalSpend;
        acc[s.platform].totalImpressions += s.totalImpressions;
        acc[s.platform].totalClicks += s.totalClicks;
        acc[s.platform].totalVideoViews += s.totalVideoViews;
        acc[s.platform].totalPurchases += s.totalPurchases;
        acc[s.platform].totalRevenue += s.totalRevenue;
        acc[s.platform].campaignCount += s.campaignCount;
        acc[s.platform].months.push({
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

    // Convert to array and add calculated fields
    const platformBreakdown = Object.values(byPlatform).map((p) => ({
      ...p,
      avgCtr: p.totalImpressions > 0 ? p.totalClicks / p.totalImpressions : 0,
      avgCpm:
        p.totalImpressions > 0 ? (p.totalSpend / p.totalImpressions) * 1000 : 0,
      avgCpc: p.totalClicks > 0 ? p.totalSpend / p.totalClicks : 0,
      avgRoas: p.totalSpend > 0 ? p.totalRevenue / p.totalSpend : 0,
      spendShare:
        totals.totalSpend > 0 ? (p.totalSpend / totals.totalSpend) * 100 : 0,
    }));

    // Group by month for trend
    const byMonth = data.reduce<Record<string, MonthAccumulator>>((acc, s) => {
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

    const monthlyTrend = Object.values(byMonth).sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        summaries: data,
        totals: {
          ...totals,
          avgCtr,
          avgCpm,
          avgCpc,
          avgRoas,
        },
        platformBreakdown: platformBreakdown.sort(
          (a, b) => b.totalSpend - a.totalSpend
        ),
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error("Error fetching monthly summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly summary" },
      { status: 500 }
    );
  }
}
