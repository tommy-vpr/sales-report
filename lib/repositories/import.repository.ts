// lib/repositories/import.repository.ts
import { prisma } from "@/lib/prisma";
import type { Platform } from "@prisma/client";

export const importRepository = {
  // ============ CAMPAIGN ============

  findCampaignByNameAndPlatform(name: string, platform: Platform) {
    return prisma.campaign.findFirst({
      where: { name, platform },
    });
  },

  createCampaign(data: {
    name: string;
    platform: Platform;
    startDate: Date;
    endDate: Date;
  }) {
    return prisma.campaign.create({ data });
  },

  // ============ CAMPAIGN METRIC ============

  findCampaignMetric(campaignId: string, reportDate: Date, region: string) {
    return prisma.campaignMetric.findFirst({
      where: { campaignId, reportDate, region },
    });
  },

  createCampaignMetric(data: {
    campaignId: string;
    reportDate: Date;
    region: string;
    impressions: number;
    clicks: number | null;
    spend: number;
    ctr: number | null;
    cpm: number | null;
    cpc: number | null;
    videoViews: number | null;
    videoViewRate: number | null;
    purchases: number | null;
    purchaseValue: number | null;
    roas: number | null;
  }) {
    return prisma.campaignMetric.create({ data });
  },

  updateCampaignMetric(
    id: string,
    data: {
      impressions: number;
      clicks: number | null;
      spend: number;
      ctr: number | null;
      cpm: number | null;
      cpc: number | null;
      videoViews: number | null;
      videoViewRate: number | null;
      purchases: number | null;
      purchaseValue: number | null;
      roas: number | null;
    }
  ) {
    return prisma.campaignMetric.update({
      where: { id },
      data,
    });
  },

  // ============ MONTHLY SUMMARY ============

  findMonthlySummary(platform: Platform, month: Date) {
    return prisma.monthlySummary.findFirst({
      where: { platform, month },
    });
  },

  createMonthlySummary(data: {
    platform: Platform;
    month: Date;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number | null;
    totalReach: number | null;
    avgCtr: number | null;
    avgCpm: number | null;
    avgCpc: number | null;
    totalVideoViews: number | null;
    totalPurchases: number | null;
    totalRevenue: number | null;
    avgRoas: number | null;
    campaignCount: number;
  }) {
    return prisma.monthlySummary.create({ data });
  },

  updateMonthlySummary(
    id: string,
    data: {
      totalSpend: number;
      totalImpressions: number;
      totalClicks: number | null;
      totalReach: number | null;
      avgCtr: number | null;
      avgCpm: number | null;
      avgCpc: number | null;
      totalVideoViews: number | null;
      totalPurchases: number | null;
      totalRevenue: number | null;
      avgRoas: number | null;
      campaignCount: number;
    }
  ) {
    return prisma.monthlySummary.update({
      where: { id },
      data,
    });
  },

  // ============ REPORT PERIODS ============

  async getReportPeriods() {
    const summaries = await prisma.monthlySummary.findMany({
      orderBy: [{ month: "desc" }],
      select: {
        month: true,
        platform: true,
        totalSpend: true,
        totalImpressions: true,
        campaignCount: true,
      },
    });

    return summaries;
  },
};
