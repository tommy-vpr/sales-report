// scripts/import-csv.ts
/**
 * Import ad analytics from CSV summary files
 * Run: npx tsx scripts/import-csv.ts "./data/April_Paid_Ads.csv" "2025-04"
 */

import { PrismaClient, Platform } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

// Parse number from string (handles $, %, commas)
function parseNumber(value: string | undefined | null): number | null {
  if (!value || value === "-" || value === "") return null;
  const cleaned = String(value)
    .replace(/[$,%\s]/g, "")
    .replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse CSV (simple parser for this format)
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  // Find header row (contains "Platform" or "Impressions")
  let headerIndex = lines.findIndex(
    (line) => line.includes("Platform") && line.includes("Impressions")
  );

  if (headerIndex === -1) {
    console.error("Could not find header row");
    return [];
  }

  const headers = lines[headerIndex].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  // Parse data rows (skip header, stop at empty or TOTAL)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith("TOTAL") || line.startsWith(",")) break;

    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
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

async function importCSV(filePath: string, monthStr: string) {
  console.log(`📁 Reading CSV: ${filePath}`);

  // Parse month string (e.g., "2025-04")
  const [year, month] = monthStr.split("-").map(Number);
  const reportDate = new Date(year, month - 1, 1);

  console.log(`📅 Report date: ${reportDate.toISOString().split("T")[0]}`);

  // Read and parse CSV
  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseCSV(content);

  console.log(`📊 Found ${rows.length} platform records`);

  let created = 0;

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

    // Create or find campaign (one per platform-month)
    const campaignName = `${platform} - ${monthStr}`;

    let campaign = await prisma.campaign.findFirst({
      where: { name: campaignName, platform },
    });

    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          name: campaignName,
          platform,
          startDate: reportDate,
          endDate: new Date(year, month, 0), // Last day of month
        },
      });
    }

    // Upsert metric
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
      ctr: ctr ? ctr / 100 : null, // Convert percentage
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

    console.log(
      `   ✓ ${platform}: ${impressions.toLocaleString()} impressions, $${spend.toFixed(
        2
      )} spend`
    );
  }

  console.log(`\n✅ Import complete! Created ${created} metrics.`);
}

// Run
const filePath = process.argv[2];
const monthStr = process.argv[3]; // e.g., "2025-04"

if (!filePath || !monthStr) {
  console.log("Usage: npx tsx scripts/import-csv.ts <csv-file> <YYYY-MM>");
  console.log(
    "Example: npx tsx scripts/import-csv.ts ./April_Paid_Ads.csv 2025-04"
  );
  process.exit(1);
}

importCSV(filePath, monthStr)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
