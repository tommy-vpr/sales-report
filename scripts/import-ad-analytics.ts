// scripts/import-ad-analytics.ts
/**
 * Script to import ad analytics data from Excel file
 * Run with: npx ts-node scripts/import-ad-analytics.ts
 */

import { PrismaClient, Platform, ObjectiveType } from "@prisma/client";
import * as XLSX from "xlsx";
import { z } from "zod";

const prisma = new PrismaClient();

// ============ PLATFORM MAPPING ============

const platformMap: Record<string, Platform> = {
  META: Platform.META,
  Meta: Platform.META,
  "Meta Ads": Platform.META,
  X: Platform.X,
  "X Ads": Platform.X,
  TWITTER: Platform.X,
  Twitter: Platform.X,
  TIKTOK: Platform.TIKTOK,
  TikTok: Platform.TIKTOK,
  "Tik Tok": Platform.TIKTOK,
  "Tik Tok Ads": Platform.TIKTOK,
  LINKEDIN: Platform.LINKEDIN,
  LinkedIn: Platform.LINKEDIN,
  Linkedin: Platform.LINKEDIN,
  TABOOLA: Platform.TABOOLA,
  Taboola: Platform.TABOOLA,
  VIBE: Platform.VIBE_CTV,
  Vibe: Platform.VIBE_CTV,
  "VIBE CTV": Platform.VIBE_CTV,
  "Wholesale Central": Platform.WHOLESALE_CENTRAL,
};

const objectiveMap: Record<string, ObjectiveType> = {
  REACH: ObjectiveType.REACH,
  Reach: ObjectiveType.REACH,
  LINK_CLICKS: ObjectiveType.LINK_CLICKS,
  "Link clicks": ObjectiveType.LINK_CLICKS,
  Traffic: ObjectiveType.LINK_CLICKS,
  "Website traffic": ObjectiveType.LINK_CLICKS,
  VIDEO_VIEWS: ObjectiveType.VIDEO_VIEWS,
  "Video views": ObjectiveType.VIDEO_VIEWS,
  BRAND_AWARENESS: ObjectiveType.BRAND_AWARENESS,
  "Brand awareness": ObjectiveType.BRAND_AWARENESS,
  OUTCOME_AWARENESS: ObjectiveType.OUTCOME_AWARENESS,
};

// ============ VALUE PARSERS ============

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || value === "-") {
    return null;
  }
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[$,%]/g, ""))
      : Number(value);
  return isNaN(num) ? null : num;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  // Handle Excel date serial number
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000);
  }

  // Handle string dates
  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
}

// ============ SHEET PARSERS ============

interface ParsedMetric {
  campaignName: string;
  platform: Platform;
  region?: string;
  objective?: ObjectiveType;
  reportDate: Date;
  impressions: number;
  clicks?: number;
  spend: number;
  reach?: number;
  ctr?: number;
  cpm?: number;
  cpc?: number;
  videoViews?: number;
  videoViewRate?: number;
  results?: number;
  resultType?: string;
  costPerResult?: number;
  purchases?: number;
  purchaseValue?: number;
  roas?: number;
  // CTV-specific
  households?: number;
  viewThroughRate?: number;
  completedViews?: number;
  sessions?: number;
  pageViews?: number;
}

function parseMetaSheet(
  data: any[],
  reportPeriod: { start: Date; end: Date }
): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];

  // Skip header rows and find actual data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || typeof row !== "object") continue;

    // Look for campaign name in first meaningful column
    const campaignName =
      row["Campaign name"] ?? row["Campaign_name"] ?? row[Object.keys(row)[0]];
    if (!campaignName || campaignName === "Campaign name") continue;

    const impressions = parseNumber(row["Impressions"] ?? row["impressions"]);
    if (!impressions) continue;

    metrics.push({
      campaignName: String(campaignName),
      platform: Platform.META,
      region: row["Region"] ?? row["region"] ?? undefined,
      objective: objectiveMap[row["Objective"] ?? ""] ?? undefined,
      reportDate: reportPeriod.start,
      impressions,
      clicks: parseNumber(row["Clicks"] ?? row["Link clicks"]) ?? undefined,
      spend: parseNumber(row["Amount spent (USD)"] ?? row["Spend"]) ?? 0,
      reach: parseNumber(row["Reach"]) ?? undefined,
      ctr: parseNumber(row["CTR (all)"] ?? row["CTR"]) ?? undefined,
      cpm: parseNumber(row["CPM (cost per 1,000 impressions)"]) ?? undefined,
      cpc: parseNumber(row["CPC (cost per link click)"]) ?? undefined,
      results: parseNumber(row["Results"]) ?? undefined,
      resultType: row["Result type"] ?? undefined,
      costPerResult: parseNumber(row["Cost per result"]) ?? undefined,
      purchases:
        parseNumber(row["Purchases"] ?? row["Website purchases"]) ?? undefined,
      purchaseValue:
        parseNumber(row["Purchases conversion value"]) ?? undefined,
      roas: parseNumber(row["Purchase ROAS (return on ad spend)"]) ?? undefined,
    });
  }

  return metrics;
}

function parseXSheet(
  data: any[],
  reportPeriod: { start: Date; end: Date }
): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];

  for (const row of data) {
    if (!row || typeof row !== "object") continue;

    const campaignName = row["Campaign name"] ?? row["Campaign_name"];
    if (!campaignName || campaignName === "Campaign name") continue;

    const impressions = parseNumber(row["Impressions"]);
    if (!impressions) continue;

    metrics.push({
      campaignName: String(campaignName),
      platform: Platform.X,
      region: row["Location"] ?? row["Region"] ?? undefined,
      objective: objectiveMap[row["Objective"] ?? ""] ?? undefined,
      reportDate: reportPeriod.start,
      impressions,
      clicks: parseNumber(row["Results"]) ?? undefined,
      spend: parseNumber(row["Spend"]) ?? 0,
      ctr: parseNumber(row["Result Rate"]) ?? undefined,
      cpm: parseNumber(row["Cost per 1k impressions"]) ?? undefined,
      cpc: parseNumber(row["Cost Per Result"]) ?? undefined,
      results: parseNumber(row["Results"]) ?? undefined,
      resultType: row["Result Type"] ?? undefined,
      costPerResult: parseNumber(row["Cost Per Result"]) ?? undefined,
      videoViews:
        row["Result Type"] === "Video views"
          ? parseNumber(row["Results"]) ?? undefined
          : undefined,
      purchases: parseNumber(row["Purchases"]) ?? undefined,
      purchaseValue: parseNumber(row["Purchases - sale amount"]) ?? undefined,
    });
  }

  return metrics;
}

function parseVibeSheet(
  data: any[],
  reportPeriod: { start: Date; end: Date }
): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];

  for (const row of data) {
    if (!row || typeof row !== "object") continue;

    const campaignName = row["Campaign"];
    if (!campaignName || campaignName === "Campaign") continue;

    const impressions = parseNumber(row["Impressions"]);
    if (!impressions) continue;

    metrics.push({
      campaignName: String(campaignName),
      platform: Platform.VIBE_CTV,
      region: row["State"] ?? row["Location"] ?? undefined,
      reportDate: reportPeriod.start,
      impressions,
      spend: parseNumber(row["Spend"]) ?? 0,
      cpm: parseNumber(row["CPM"]) ?? undefined,
      households: parseNumber(row["Households"]) ?? undefined,
      viewThroughRate: parseNumber(row["View-Through Rate"]) ?? undefined,
      completedViews: parseNumber(row["Completed View"]) ?? undefined,
      sessions: parseNumber(row["Sessions"]) ?? undefined,
      pageViews: parseNumber(row["Page Views"]) ?? undefined,
      purchases: parseNumber(row["Purchases"]) ?? undefined,
      purchaseValue: parseNumber(row["Revenue"]) ?? undefined,
      roas: parseNumber(row["ROAS"]) ?? undefined,
    });
  }

  return metrics;
}

// ============ MAIN IMPORT FUNCTION ============

async function importFromExcel(filePath: string) {
  console.log(`📁 Reading Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const allMetrics: ParsedMetric[] = [];

  // Define report periods based on sheet names
  const sheetConfig: Record<
    string,
    { parser: Function; period: { start: Date; end: Date } }
  > = {
    "Meta April": {
      parser: parseMetaSheet,
      period: { start: new Date("2025-04-01"), end: new Date("2025-04-30") },
    },
    "Meta Ads": {
      parser: parseMetaSheet,
      period: { start: new Date("2025-05-01"), end: new Date("2025-05-30") },
    },
    "Meta June": {
      parser: parseMetaSheet,
      period: { start: new Date("2025-06-01"), end: new Date("2025-06-30") },
    },
    "Meta August": {
      parser: parseMetaSheet,
      period: { start: new Date("2025-08-01"), end: new Date("2025-08-29") },
    },
    "Meta Sept": {
      parser: parseMetaSheet,
      period: { start: new Date("2025-09-01"), end: new Date("2025-09-30") },
    },
    "Meta Oct": {
      parser: parseMetaSheet,
      period: { start: new Date("2025-10-01"), end: new Date("2025-10-30") },
    },
    "Meta Nov": {
      parser: parseMetaSheet,
      period: { start: new Date("2025-11-01"), end: new Date("2025-11-30") },
    },
    "X April": {
      parser: parseXSheet,
      period: { start: new Date("2025-04-01"), end: new Date("2025-04-30") },
    },
    "X May": {
      parser: parseXSheet,
      period: { start: new Date("2025-05-01"), end: new Date("2025-05-31") },
    },
    "X August": {
      parser: parseXSheet,
      period: { start: new Date("2025-08-01"), end: new Date("2025-08-29") },
    },
    "X Sept": {
      parser: parseXSheet,
      period: { start: new Date("2025-09-01"), end: new Date("2025-09-30") },
    },
    "X Oct": {
      parser: parseXSheet,
      period: { start: new Date("2025-10-01"), end: new Date("2025-10-30") },
    },
    "Vibe August": {
      parser: parseVibeSheet,
      period: { start: new Date("2025-08-27"), end: new Date("2025-08-29") },
    },
    "Vibe Sept": {
      parser: parseVibeSheet,
      period: { start: new Date("2025-09-01"), end: new Date("2025-09-26") },
    },
    "Vibe Oct": {
      parser: parseVibeSheet,
      period: { start: new Date("2025-10-03"), end: new Date("2025-10-31") },
    },
    "Vibe Nov": {
      parser: parseVibeSheet,
      period: { start: new Date("2025-11-04"), end: new Date("2025-11-30") },
    },
  };

  // Process each configured sheet
  for (const [sheetName, config] of Object.entries(sheetConfig)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log(`⚠️ Sheet "${sheetName}" not found, skipping...`);
      continue;
    }

    console.log(`📊 Processing sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const metrics = config.parser(data, config.period);
    console.log(`   Found ${metrics.length} records`);
    allMetrics.push(...metrics);
  }

  console.log(`\n📝 Total metrics to import: ${allMetrics.length}`);

  // Group metrics by campaign
  const campaignMap = new Map<string, ParsedMetric[]>();
  for (const metric of allMetrics) {
    const key = `${metric.platform}:${metric.campaignName}`;
    if (!campaignMap.has(key)) {
      campaignMap.set(key, []);
    }
    campaignMap.get(key)!.push(metric);
  }

  console.log(`📂 Found ${campaignMap.size} unique campaigns`);

  // Insert into database
  let campaignsCreated = 0;
  let metricsCreated = 0;

  for (const [key, metrics] of campaignMap) {
    const [platform, campaignName] = key.split(":", 2);
    const firstMetric = metrics[0];

    // Upsert campaign
    const campaign = await prisma.campaign.upsert({
      where: {
        id: `${platform}-${campaignName}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-"),
      },
      create: {
        id: `${platform}-${campaignName}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-"),
        name: campaignName,
        platform: firstMetric.platform,
        objective: firstMetric.objective,
      },
      update: {
        objective: firstMetric.objective,
      },
    });
    campaignsCreated++;

    // Insert metrics
    for (const metric of metrics) {
      await prisma.campaignMetric.upsert({
        where: {
          campaignId_reportDate_region: {
            campaignId: campaign.id,
            reportDate: metric.reportDate,
            region: metric.region ?? "ALL",
          },
        },
        create: {
          campaignId: campaign.id,
          reportDate: metric.reportDate,
          region: metric.region ?? "ALL",
          impressions: metric.impressions,
          clicks: metric.clicks,
          spend: metric.spend,
          reach: metric.reach,
          ctr: metric.ctr,
          cpm: metric.cpm,
          cpc: metric.cpc,
          videoViews: metric.videoViews,
          videoViewRate: metric.videoViewRate,
          results: metric.results,
          resultType: metric.resultType,
          costPerResult: metric.costPerResult,
          purchases: metric.purchases,
          purchaseValue: metric.purchaseValue,
          roas: metric.roas,
          households: metric.households,
          viewThroughRate: metric.viewThroughRate,
          completedViews: metric.completedViews,
          sessions: metric.sessions,
          pageViews: metric.pageViews,
        },
        update: {
          impressions: metric.impressions,
          clicks: metric.clicks,
          spend: metric.spend,
          reach: metric.reach,
          ctr: metric.ctr,
          cpm: metric.cpm,
          cpc: metric.cpc,
          purchases: metric.purchases,
          purchaseValue: metric.purchaseValue,
          roas: metric.roas,
        },
      });
      metricsCreated++;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Campaigns: ${campaignsCreated}`);
  console.log(`   Metrics: ${metricsCreated}`);
}

// ============ RUN ============

const filePath = process.argv[2] ?? "./LITTO_Ad_Analytics_2025.xlsx";

importFromExcel(filePath)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
