// app/api/reports/periods/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all monthly summaries (faster than querying campaign metrics)
    const summaries = await prisma.monthlySummary.findMany({
      select: {
        platform: true,
        month: true,
        totalSpend: true,
        totalImpressions: true,
        campaignCount: true,
      },
      orderBy: {
        month: "desc",
      },
    });

    // Group by month
    const periodsMap = new Map<
      string,
      {
        year: number;
        month: number;
        platforms: string[];
        totalSpend: number;
        totalImpressions: number;
        campaignCount: number;
      }
    >();

    for (const summary of summaries) {
      const date = new Date(summary.month);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!periodsMap.has(key)) {
        periodsMap.set(key, {
          year,
          month,
          platforms: [],
          totalSpend: 0,
          totalImpressions: 0,
          campaignCount: 0,
        });
      }

      const period = periodsMap.get(key)!;
      period.platforms.push(summary.platform);
      period.totalSpend += Number(summary.totalSpend);
      period.totalImpressions += Number(summary.totalImpressions);
      period.campaignCount += Number(summary.campaignCount);
    }

    // Convert to array and sort
    const periods = Array.from(periodsMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .map((p) => ({
        year: p.year,
        month: p.month,
        monthName: new Date(p.year, p.month - 1).toLocaleString("en-US", {
          month: "long",
        }),
        label: `${new Date(p.year, p.month - 1).toLocaleString("en-US", {
          month: "long",
        })} ${p.year}`,
        platforms: p.platforms,
        platformCount: p.platforms.length,
        totalSpend: p.totalSpend,
        totalImpressions: p.totalImpressions,
        campaignCount: p.campaignCount,
      }));

    // Get unique years
    const years = [...new Set(periods.map((p) => p.year))].sort(
      (a, b) => b - a
    );

    // Calculate totals
    const totals = {
      totalSpend: periods.reduce((sum, p) => sum + p.totalSpend, 0),
      totalImpressions: periods.reduce((sum, p) => sum + p.totalImpressions, 0),
      campaignCount: periods.reduce((sum, p) => sum + p.campaignCount, 0),
    };

    return NextResponse.json({
      periods,
      years,
      totalReports: periods.length,
      totals,
    });
  } catch (error) {
    console.error("Error fetching periods:", error);
    return NextResponse.json(
      { error: "Failed to fetch periods" },
      { status: 500 }
    );
  }
}
