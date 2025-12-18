// lib/services/import.service.ts
import { Platform } from "@prisma/client";
import { importRepository } from "@/lib/repositories/import.repository";
import type {
  ImportCSVInput,
  ImportResult,
  ImportPeriod,
  ParsedCSVRow,
  PlatformTotals,
  ReportPeriodsData,
  ReportPeriod,
} from "@/lib/schemas/import";

// ============ CONSTANTS ============

const PLATFORM_MAP: Record<string, Platform> = {
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

const MONTH_NAMES: Record<string, number> = {
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

// ============ HELPERS ============

function parseNumber(value: string | undefined | null): number | null {
  if (!value || value === "-" || value === "" || value === "0") return null;
  const cleaned = String(value)
    .replace(/[$,%\s"]/g, "")
    .replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function getRowValue(
  row: Record<string, string>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  return null;
}

function parseCSV(content: string): {
  rows: Record<string, string>[];
  headers: string[];
} {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

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

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith("TOTAL") || line.startsWith(",")) break;

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

    if (row["Platform"] && PLATFORM_MAP[row["Platform"]]) {
      rows.push(row);
    }
  }

  return { rows, headers };
}

function extractPeriod(content: string, filename: string): ImportPeriod {
  const firstLine = content.split(/\r?\n/)[0];
  const lowerFirst = firstLine.toLowerCase();

  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (lowerFirst.includes(name)) {
      const yearMatch = firstLine.match(/'?(\d{2,4})/);
      let year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      if (year < 100) year += 2000;
      return { year, month: num };
    }
  }

  const lowerFilename = filename.toLowerCase();
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (lowerFilename.includes(name)) {
      const yearMatch = filename.match(/(\d{4})/);
      const year = yearMatch
        ? parseInt(yearMatch[1])
        : new Date().getFullYear();
      return { year, month: num };
    }
  }

  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function transformRow(row: Record<string, string>): ParsedCSVRow | null {
  const platform = PLATFORM_MAP[row["Platform"]];
  if (!platform) return null;

  const impressions = parseNumber(row["Impressions"]);
  if (!impressions) return null;

  const clicks = parseNumber(getRowValue(row, "Link Clicks", "Clicks"));
  const spend = parseNumber(row["Cost"]) ?? 0;
  const ctr = parseNumber(getRowValue(row, "CTR %", "CTR"));
  const cpc = parseNumber(getRowValue(row, "CPC (cost per click)", "CPC"));
  const cpm = parseNumber(getRowValue(row, "CPM (cost per 1000 views)", "CPM"));
  const videoViews = parseNumber(row["Video Views"]);
  const videoViewRate = parseNumber(row["Video View Rate"]);
  const purchases = parseNumber(row["Purchases"]);
  const roas = parseNumber(getRowValue(row, "ROAS %", "ROAS"));
  const purchaseValue = parseNumber(row["Purchase Value"]);

  const calculatedCpm =
    cpm ?? (impressions > 0 ? (spend / impressions) * 1000 : null);
  const calculatedCpc = cpc ?? (clicks && clicks > 0 ? spend / clicks : null);
  const calculatedCtr = ctr
    ? ctr / 100
    : clicks && impressions > 0
    ? clicks / impressions
    : null;
  const calculatedRoas = roas
    ? roas / 100
    : purchaseValue && spend > 0
    ? purchaseValue / spend
    : null;

  return {
    platform,
    impressions,
    clicks,
    spend,
    ctr: calculatedCtr,
    cpm: calculatedCpm,
    cpc: calculatedCpc,
    videoViews,
    videoViewRate: videoViewRate ? videoViewRate / 100 : null,
    purchases,
    purchaseValue,
    roas: calculatedRoas,
  };
}

// ============ SERVICE ============

export const importService = {
  async importCSV(input: ImportCSVInput): Promise<ImportResult> {
    const {
      fileContent,
      fileName,
      year: yearOverride,
      month: monthOverride,
    } = input;

    const { rows } = parseCSV(fileContent);

    if (rows.length === 0) {
      throw new Error("No valid data found in CSV");
    }

    const period =
      yearOverride && monthOverride
        ? { year: yearOverride, month: monthOverride }
        : extractPeriod(fileContent, fileName);

    const reportDate = new Date(period.year, period.month - 1, 1);
    const monthStart = new Date(period.year, period.month - 1, 1);

    let created = 0;
    let updated = 0;
    const platformTotals = new Map<Platform, PlatformTotals>();

    for (const row of rows) {
      const parsed = transformRow(row);
      if (!parsed) continue;

      const { platform, ...metricData } = parsed;

      // Campaign name
      const monthName = reportDate.toLocaleString("en-US", { month: "long" });
      const campaignName = `${platform} - ${monthName} ${period.year}`;

      // Find or create campaign
      let campaign = await importRepository.findCampaignByNameAndPlatform(
        campaignName,
        platform
      );

      if (!campaign) {
        campaign = await importRepository.createCampaign({
          name: campaignName,
          platform,
          startDate: reportDate,
          endDate: new Date(period.year, period.month, 0),
        });
      }

      // Check for existing metric
      const existingMetric = await importRepository.findCampaignMetric(
        campaign.id,
        reportDate,
        "ALL"
      );

      if (existingMetric) {
        await importRepository.updateCampaignMetric(
          existingMetric.id,
          metricData
        );
        updated++;
      } else {
        await importRepository.createCampaignMetric({
          campaignId: campaign.id,
          reportDate,
          region: "ALL",
          ...metricData,
        });
        created++;
      }

      // Accumulate platform totals
      this.accumulatePlatformTotals(platformTotals, platform, parsed);
    }

    // Upsert monthly summaries
    const summariesUpdated = await this.upsertMonthlySummaries(
      platformTotals,
      monthStart
    );

    return {
      period: {
        year: period.year,
        month: period.month,
        monthName: reportDate.toLocaleString("en-US", { month: "long" }),
      },
      records: { created, updated, total: created + updated },
      summaries: {
        platforms: summariesUpdated,
        count: summariesUpdated.length,
      },
    };
  },

  accumulatePlatformTotals(
    totalsMap: Map<Platform, PlatformTotals>,
    platform: Platform,
    data: ParsedCSVRow
  ) {
    if (!totalsMap.has(platform)) {
      totalsMap.set(platform, {
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
        cpmSum: 0,
        cpmCount: 0,
        cpcSum: 0,
        cpcCount: 0,
        roasSum: 0,
        roasCount: 0,
      });
    }

    const totals = totalsMap.get(platform)!;
    totals.totalSpend += data.spend;
    totals.totalImpressions += data.impressions;
    totals.totalClicks += data.clicks ?? 0;
    totals.totalVideoViews += data.videoViews ?? 0;
    totals.totalPurchases += data.purchases ?? 0;
    totals.totalRevenue += data.purchaseValue ?? 0;
    totals.campaignCount += 1;

    if (data.ctr) {
      totals.ctrSum += data.ctr;
      totals.ctrCount += 1;
    }
    if (data.cpm) {
      totals.cpmSum += data.cpm;
      totals.cpmCount += 1;
    }
    if (data.cpc) {
      totals.cpcSum += data.cpc;
      totals.cpcCount += 1;
    }
    if (data.roas) {
      totals.roasSum += data.roas;
      totals.roasCount += 1;
    }
  },

  async upsertMonthlySummaries(
    platformTotals: Map<Platform, PlatformTotals>,
    monthStart: Date
  ): Promise<string[]> {
    const summariesUpdated: string[] = [];

    for (const [platform, totals] of platformTotals) {
      const avgCtr =
        totals.ctrCount > 0 ? totals.ctrSum / totals.ctrCount : null;
      const avgCpm =
        totals.cpmCount > 0
          ? totals.cpmSum / totals.cpmCount
          : totals.totalImpressions > 0
          ? (totals.totalSpend / totals.totalImpressions) * 1000
          : null;
      const avgCpc =
        totals.cpcCount > 0
          ? totals.cpcSum / totals.cpcCount
          : totals.totalClicks > 0
          ? totals.totalSpend / totals.totalClicks
          : null;
      const avgRoas =
        totals.roasCount > 0
          ? totals.roasSum / totals.roasCount
          : totals.totalRevenue > 0 && totals.totalSpend > 0
          ? totals.totalRevenue / totals.totalSpend
          : null;

      const summaryData = {
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
      };

      const existingSummary = await importRepository.findMonthlySummary(
        platform,
        monthStart
      );

      if (existingSummary) {
        await importRepository.updateMonthlySummary(
          existingSummary.id,
          summaryData
        );
      } else {
        await importRepository.createMonthlySummary({
          platform,
          month: monthStart,
          ...summaryData,
        });
      }

      summariesUpdated.push(platform);
    }

    return summariesUpdated;
  },

  async getReportPeriods(): Promise<ReportPeriodsData> {
    const summaries = await importRepository.getReportPeriods();

    const byMonth = new Map<string, ReportPeriod>();
    const yearsSet = new Set<number>();

    for (const s of summaries) {
      const key = s.month.toISOString();
      const year = s.month.getFullYear();
      yearsSet.add(year);

      const existing = byMonth.get(key);

      if (existing) {
        existing.platformCount += 1;
        existing.campaignCount += s.campaignCount;
        existing.totalSpend += Number(s.totalSpend);
        existing.totalImpressions += Number(s.totalImpressions);
      } else {
        byMonth.set(key, {
          year,
          month: s.month.getMonth() + 1,
          label: s.month.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          }),
          monthName: s.month.toLocaleString("en-US", { month: "long" }),
          platformCount: 1,
          campaignCount: s.campaignCount,
          totalSpend: Number(s.totalSpend),
          totalImpressions: Number(s.totalImpressions),
        });
      }
    }

    const periods = Array.from(byMonth.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);

    const totals = periods.reduce(
      (acc, p) => ({
        totalSpend: acc.totalSpend + p.totalSpend,
        totalImpressions: acc.totalImpressions + p.totalImpressions,
      }),
      { totalSpend: 0, totalImpressions: 0 }
    );

    return { periods, years, totals };
  },
};
