// app/api/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Platform } from "@prisma/client";

// Platform mapping
const platformMap: Record<string, Platform> = {
  "Meta Ads": Platform.META,
  Meta: Platform.META,
  "X Ads": Platform.X,
  X: Platform.X,
  "Tik Tok Ads": Platform.TIKTOK,
  "TikTok Ads": Platform.TIKTOK,
  TikTok: Platform.TIKTOK,
  "LinkedIn Ads": Platform.LINKEDIN,
  LinkedIn: Platform.LINKEDIN,
  Taboola: Platform.TABOOLA,
  Vibe: Platform.VIBE_CTV,
  "Vibe CTV": Platform.VIBE_CTV,
  "Wholesale Central": Platform.WHOLESALE_CENTRAL,
};

// Parse number from string (handles $, %, commas, dashes)
function parseNumber(value: string | undefined | null): number | null {
  if (!value || value === "-" || value === "") return null;
  const cleaned = String(value)
    .replace(/[$,%\s"]/g, "")
    .replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse CSV content
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  // Find header row (contains "Platform" and "Impressions")
  const headerIndex = lines.findIndex(
    (line) => line.includes("Platform") && line.includes("Impressions")
  );

  if (headerIndex === -1) {
    throw new Error(
      "Could not find header row with Platform and Impressions columns"
    );
  }

  const headers = lines[headerIndex].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  // Parse data rows (skip header, stop at empty or TOTAL)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith("TOTAL") || line.startsWith(",")) break;

    // Handle quoted values with commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) row[header] = values[idx] || "";
    });

    if (row["Platform"] && platformMap[row["Platform"]]) {
      rows.push(row);
    }
  }

  return rows;
}

// Extract month/year from filename or first row
function extractPeriod(
  content: string,
  filename: string
): { year: number; month: number } {
  // Try to extract from first line (e.g., "LITTO - April '25")
  const firstLine = content.split(/\r?\n/)[0];

  const monthNames: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    sept: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };

  // Check first line for month
  const lowerFirst = firstLine.toLowerCase();
  for (const [name, num] of Object.entries(monthNames)) {
    if (lowerFirst.includes(name)) {
      // Extract year
      const yearMatch = firstLine.match(/'?(\d{2,4})/);
      let year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      if (year < 100) year += 2000;
      return { year, month: num };
    }
  }

  // Try filename
  const lowerFilename = filename.toLowerCase();
  for (const [name, num] of Object.entries(monthNames)) {
    if (lowerFilename.includes(name)) {
      const yearMatch = filename.match(/(\d{4})/);
      const year = yearMatch
        ? parseInt(yearMatch[1])
        : new Date().getFullYear();
      return { year, month: num };
    }
  }

  // Default to current month
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// Type for tracking platform totals
interface PlatformTotals {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalVideoViews: number;
  totalPurchases: number;
  totalRevenue: number;
  campaignCount: number;
  ctrSum: number;
  ctrCount: number;
  roasSum: number;
  roasCount: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const yearOverride = formData.get("year") as string | null;
    const monthOverride = formData.get("month") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const content = await file.text();
    const rows = parseCSV(content);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid data found in CSV" },
        { status: 400 }
      );
    }

    // Get period from overrides or extract from file
    let period: { year: number; month: number };
    if (yearOverride && monthOverride) {
      period = { year: parseInt(yearOverride), month: parseInt(monthOverride) };
    } else {
      period = extractPeriod(content, file.name);
    }

    const reportDate = new Date(period.year, period.month - 1, 1);
    const monthStart = new Date(period.year, period.month - 1, 1); // First day of month

    let created = 0;
    let updated = 0;

    // Track totals by platform for MonthlySummary
    const platformTotals = new Map<Platform, PlatformTotals>();

    for (const row of rows) {
      const platform = platformMap[row["Platform"]];
      if (!platform) continue;

      const impressions = parseNumber(row["Impressions"]);
      const clicks = parseNumber(row["Clicks"]);
      const spend = parseNumber(row["Cost"]) ?? 0;
      const ctr = parseNumber(row["CTR %"]);
      const videoViews = parseNumber(row["Video Views"]);
      const videoViewRate = parseNumber(row["Video View Rate"]);

      if (!impressions) continue;

      // Create campaign name based on platform and month
      const monthName = reportDate.toLocaleString("en-US", { month: "long" });
      const campaignName = `${platform} - ${monthName} ${period.year}`;

      // Find or create campaign
      let campaign = await prisma.campaign.findFirst({
        where: { name: campaignName, platform },
      });

      if (!campaign) {
        campaign = await prisma.campaign.create({
          data: {
            name: campaignName,
            platform,
            startDate: reportDate,
            endDate: new Date(period.year, period.month, 0),
          },
        });
      }

      // Check for existing metric
      const existingMetric = await prisma.campaignMetric.findFirst({
        where: {
          campaignId: campaign.id,
          reportDate,
          region: "ALL",
        },
      });

      const metricData = {
        impressions,
        clicks,
        spend,
        ctr: ctr ? ctr / 100 : null,
        videoViews,
        videoViewRate: videoViewRate ? videoViewRate / 100 : null,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
        cpc: clicks && clicks > 0 ? spend / clicks : null,
      };

      if (existingMetric) {
        await prisma.campaignMetric.update({
          where: { id: existingMetric.id },
          data: metricData,
        });
        updated++;
      } else {
        await prisma.campaignMetric.create({
          data: {
            campaignId: campaign.id,
            reportDate,
            region: "ALL",
            ...metricData,
          },
        });
        created++;
      }

      // Accumulate totals for MonthlySummary
      if (!platformTotals.has(platform)) {
        platformTotals.set(platform, {
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalReach: 0,
          totalVideoViews: 0,
          totalPurchases: 0,
          totalRevenue: 0,
          campaignCount: 0,
          ctrSum: 0,
          ctrCount: 0,
          roasSum: 0,
          roasCount: 0,
        });
      }

      const totals = platformTotals.get(platform)!;
      totals.totalSpend += spend;
      totals.totalImpressions += impressions;
      totals.totalClicks += clicks ?? 0;
      totals.totalVideoViews += videoViews ?? 0;
      totals.campaignCount += 1;

      if (ctr) {
        totals.ctrSum += ctr / 100;
        totals.ctrCount += 1;
      }
    }

    // Upsert MonthlySummary for each platform
    const summariesUpdated: string[] = [];

    for (const [platform, totals] of platformTotals) {
      const avgCtr =
        totals.ctrCount > 0 ? totals.ctrSum / totals.ctrCount : null;
      const avgCpm =
        totals.totalImpressions > 0
          ? (totals.totalSpend / totals.totalImpressions) * 1000
          : null;
      const avgCpc =
        totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : null;
      const avgRoas =
        totals.roasCount > 0 ? totals.roasSum / totals.roasCount : null;

      // Check if summary exists
      const existingSummary = await prisma.monthlySummary.findFirst({
        where: {
          platform,
          month: monthStart,
        },
      });

      if (existingSummary) {
        // Update existing summary
        await prisma.monthlySummary.update({
          where: { id: existingSummary.id },
          data: {
            totalSpend: totals.totalSpend,
            totalImpressions: totals.totalImpressions,
            totalClicks: totals.totalClicks || null,
            totalReach: totals.totalReach || null,
            avgCtr,
            avgCpm,
            avgCpc,
            totalVideoViews: totals.totalVideoViews || null,
            totalPurchases: totals.totalPurchases || null,
            totalRevenue: totals.totalRevenue || null,
            avgRoas,
            campaignCount: totals.campaignCount,
          },
        });
      } else {
        // Create new summary
        await prisma.monthlySummary.create({
          data: {
            platform,
            month: monthStart,
            totalSpend: totals.totalSpend,
            totalImpressions: totals.totalImpressions,
            totalClicks: totals.totalClicks || null,
            totalReach: totals.totalReach || null,
            avgCtr,
            avgCpm,
            avgCpc,
            totalVideoViews: totals.totalVideoViews || null,
            totalPurchases: totals.totalPurchases || null,
            totalRevenue: totals.totalRevenue || null,
            avgRoas,
            campaignCount: totals.campaignCount,
          },
        });
      }

      summariesUpdated.push(platform);
    }

    return NextResponse.json({
      success: true,
      period: {
        year: period.year,
        month: period.month,
        monthName: reportDate.toLocaleString("en-US", { month: "long" }),
      },
      records: {
        created,
        updated,
        total: created + updated,
      },
      summaries: {
        platforms: summariesUpdated,
        count: summariesUpdated.length,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
