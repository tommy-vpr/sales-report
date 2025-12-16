// services/sales-report.service.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  Platform,
  ReportFilters,
  GetReportInput,
  GetPlatformOverviewInput,
  GetCampaignPerformanceInput,
  GetRegionalBreakdownInput,
  GetTopPerformersInput,
  GetTrendAnalysisInput,
  DashboardOverview,
  PlatformSummary,
  RegionalPerformance,
  TimeSeriesPoint,
  SortOptions,
  Pagination,
} from "@/lib/schemas/sales-report";

// Helper to build date filter
function buildDateFilter(dateRange?: { startDate: Date; endDate: Date }) {
  if (!dateRange) return {};
  return {
    reportDate: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
  };
}

// Helper to build platform filter
function buildPlatformFilter(platforms?: Platform[]) {
  if (!platforms?.length) return {};
  return {
    campaign: {
      platform: { in: platforms },
    },
  };
}

// Helper for decimal conversion
function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

export const salesReportService = {
  // ============ DASHBOARD OVERVIEW ============
  async getDashboardOverview(
    input: GetPlatformOverviewInput
  ): Promise<DashboardOverview> {
    const { dateRange, compareWith } = input;

    // Current period aggregations
    const currentMetrics = await prisma.campaignMetric.aggregate({
      where: buildDateFilter(dateRange),
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        purchases: true,
        purchaseValue: true,
      },
      _avg: {
        ctr: true,
        cpm: true,
        cpc: true,
        roas: true,
      },
    });

    // Platform breakdown
    const platformBreakdown = await this.getPlatformBreakdown(dateRange);

    // Top regions
    const topRegions = await this.getRegionalBreakdown({
      dateRange,
      metric: "spend",
      limit: 10,
    });

    // Spend trend (daily)
    const spendTrend = await this.getMetricTrend({
      dateRange,
      metrics: ["spend"],
      groupBy: "daily",
    });

    // Previous period comparison
    let previousPeriod;
    if (compareWith) {
      const prevMetrics = await prisma.campaignMetric.aggregate({
        where: buildDateFilter(compareWith),
        _sum: {
          spend: true,
          impressions: true,
          clicks: true,
        },
      });
      previousPeriod = {
        totalSpend: toNumber(prevMetrics._sum.spend),
        totalImpressions: prevMetrics._sum.impressions ?? 0,
        totalClicks: prevMetrics._sum.clicks ?? 0,
      };
    }

    return {
      totalSpend: toNumber(currentMetrics._sum.spend),
      totalImpressions: currentMetrics._sum.impressions ?? 0,
      totalClicks: currentMetrics._sum.clicks ?? 0,
      avgCtr: toNumber(currentMetrics._avg.ctr),
      avgCpm: toNumber(currentMetrics._avg.cpm),
      avgCpc: toNumber(currentMetrics._avg.cpc),
      totalPurchases: currentMetrics._sum.purchases ?? 0,
      totalRevenue: toNumber(currentMetrics._sum.purchaseValue),
      avgRoas: toNumber(currentMetrics._avg.roas),
      platformBreakdown,
      topRegions,
      spendTrend,
      previousPeriod,
    };
  },

  // ============ PLATFORM BREAKDOWN ============
  async getPlatformBreakdown(dateRange: {
    startDate: Date;
    endDate: Date;
  }): Promise<PlatformSummary[]> {
    const results = await prisma.$queryRaw<
      Array<{
        platform: Platform;
        total_spend: Prisma.Decimal;
        total_impressions: bigint;
        total_clicks: bigint;
        avg_ctr: Prisma.Decimal;
        avg_cpm: Prisma.Decimal;
        avg_cpc: Prisma.Decimal;
        total_purchases: bigint;
        total_revenue: Prisma.Decimal;
        avg_roas: Prisma.Decimal;
        campaign_count: bigint;
      }>
    >`
      SELECT 
        c.platform,
        COALESCE(SUM(cm.spend), 0) as total_spend,
        COALESCE(SUM(cm.impressions), 0) as total_impressions,
        COALESCE(SUM(cm.clicks), 0) as total_clicks,
        AVG(cm.ctr) as avg_ctr,
        AVG(cm.cpm) as avg_cpm,
        AVG(cm.cpc) as avg_cpc,
        COALESCE(SUM(cm.purchases), 0) as total_purchases,
        COALESCE(SUM(cm."purchaseValue"), 0) as total_revenue,
        AVG(cm.roas) as avg_roas,
        COUNT(DISTINCT c.id) as campaign_count
      FROM "Campaign" c
      LEFT JOIN "CampaignMetric" cm ON c.id = cm."campaignId"
      WHERE cm."reportDate" >= ${dateRange.startDate}
        AND cm."reportDate" <= ${dateRange.endDate}
      GROUP BY c.platform
      ORDER BY total_spend DESC
    `;

    return results.map((r) => ({
      platform: r.platform,
      totalSpend: toNumber(r.total_spend),
      totalImpressions: Number(r.total_impressions),
      totalClicks: Number(r.total_clicks),
      avgCtr: toNumber(r.avg_ctr),
      avgCpm: toNumber(r.avg_cpm),
      avgCpc: toNumber(r.avg_cpc),
      totalPurchases: Number(r.total_purchases),
      totalRevenue: toNumber(r.total_revenue),
      avgRoas: toNumber(r.avg_roas),
      campaignCount: Number(r.campaign_count),
    }));
  },

  // ============ REGIONAL BREAKDOWN ============
  async getRegionalBreakdown(
    input: GetRegionalBreakdownInput
  ): Promise<RegionalPerformance[]> {
    const { dateRange, platforms, metric, limit } = input;

    const where: Prisma.CampaignMetricWhereInput = {
      ...buildDateFilter(dateRange),
      ...(platforms?.length
        ? { campaign: { platform: { in: platforms } } }
        : {}),
      region: { not: null },
    };

    // Get total for percentage calculation
    const total = await prisma.campaignMetric.aggregate({
      where,
      _sum: { [metric === "conversions" ? "purchases" : metric]: true },
    });

    const totalValue = toNumber(
      total._sum[metric === "conversions" ? "purchases" : metric]
    );

    // Get regional breakdown
    const regions = await prisma.campaignMetric.groupBy({
      by: ["region"],
      where,
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        purchases: true,
      },
      _avg: {
        ctr: true,
        cpm: true,
      },
      orderBy: {
        _sum: { [metric === "conversions" ? "purchases" : metric]: "desc" },
      },
      take: limit,
    });

    return regions
      .filter((r) => r.region)
      .map((r) => ({
        region: r.region!,
        totalSpend: toNumber(r._sum.spend),
        totalImpressions: r._sum.impressions ?? 0,
        totalClicks: r._sum.clicks ?? 0,
        avgCtr: toNumber(r._avg.ctr),
        avgCpm: toNumber(r._avg.cpm),
        purchases: r._sum.purchases ?? 0,
        percentOfTotal:
          totalValue > 0
            ? (toNumber(
                r._sum[metric === "conversions" ? "purchases" : metric]
              ) /
                totalValue) *
              100
            : 0,
      }));
  },

  // ============ METRIC TRENDS ============
  async getMetricTrend(
    input: GetTrendAnalysisInput
  ): Promise<TimeSeriesPoint[]> {
    const { dateRange, metrics, groupBy, platforms } = input;

    const dateFormat = {
      daily: "YYYY-MM-DD",
      weekly: "IYYY-IW",
      monthly: "YYYY-MM",
      quarterly: "YYYY-Q",
    }[groupBy];

    const results = await prisma.$queryRaw<
      Array<{
        period: string;
        spend: Prisma.Decimal;
        impressions: bigint;
        ctr: Prisma.Decimal;
        cpm: Prisma.Decimal;
        roas: Prisma.Decimal;
      }>
    >`
      SELECT 
        TO_CHAR(cm."reportDate", ${dateFormat}) as period,
        SUM(cm.spend) as spend,
        SUM(cm.impressions) as impressions,
        AVG(cm.ctr) as ctr,
        AVG(cm.cpm) as cpm,
        AVG(cm.roas) as roas
      FROM "CampaignMetric" cm
      ${
        platforms?.length
          ? Prisma.sql`
        JOIN "Campaign" c ON cm."campaignId" = c.id
        WHERE c.platform IN (${Prisma.join(platforms)})
        AND cm."reportDate" >= ${dateRange.startDate}
        AND cm."reportDate" <= ${dateRange.endDate}
      `
          : Prisma.sql`
        WHERE cm."reportDate" >= ${dateRange.startDate}
        AND cm."reportDate" <= ${dateRange.endDate}
      `
      }
      GROUP BY period
      ORDER BY period ASC
    `;

    // Flatten into TimeSeriesPoint array
    return results.flatMap((r) =>
      metrics.map((metric) => ({
        date: r.period,
        value:
          metric === "impressions"
            ? Number(r.impressions)
            : toNumber(r[metric as keyof typeof r] as Prisma.Decimal),
        metric,
      }))
    );
  },

  // ============ CAMPAIGN PERFORMANCE ============
  async getCampaignPerformance(input: GetCampaignPerformanceInput) {
    const { campaignId, dateRange, groupBy } = input;

    const where: Prisma.CampaignMetricWhereInput = {
      ...buildDateFilter(dateRange),
      ...(campaignId ? { campaignId } : {}),
    };

    if (groupBy === "region") {
      return prisma.campaignMetric.groupBy({
        by: ["region"],
        where,
        _sum: {
          spend: true,
          impressions: true,
          clicks: true,
          purchases: true,
          purchaseValue: true,
        },
        _avg: {
          ctr: true,
          cpm: true,
          cpc: true,
          roas: true,
        },
        orderBy: { _sum: { spend: "desc" } },
      });
    }

    // Group by day/week
    return prisma.campaignMetric.findMany({
      where,
      select: {
        reportDate: true,
        region: true,
        impressions: true,
        clicks: true,
        spend: true,
        ctr: true,
        cpm: true,
        cpc: true,
        results: true,
        purchases: true,
        purchaseValue: true,
        roas: true,
        campaign: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
      },
      orderBy: { reportDate: "asc" },
    });
  },

  // ============ TOP PERFORMERS ============
  async getTopPerformers(input: GetTopPerformersInput) {
    const { dateRange, metric, entityType, limit } = input;

    const orderByField = {
      spend: { spend: "desc" },
      impressions: { impressions: "desc" },
      clicks: { clicks: "desc" },
      ctr: { ctr: "desc" },
      cpm: { cpm: "asc" }, // Lower is better
      cpc: { cpc: "asc" }, // Lower is better
      roas: { roas: "desc" },
      purchases: { purchases: "desc" },
      reportDate: { reportDate: "desc" },
    }[metric] as Prisma.CampaignMetricOrderByWithRelationInput;

    if (entityType === "campaign") {
      const campaigns = await prisma.campaign.findMany({
        where: {
          metrics: {
            some: buildDateFilter(dateRange),
          },
        },
        include: {
          metrics: {
            where: buildDateFilter(dateRange),
          },
        },
        take: limit,
      });

      // Aggregate metrics per campaign
      return campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        totalSpend: c.metrics.reduce((sum, m) => sum + toNumber(m.spend), 0),
        totalImpressions: c.metrics.reduce(
          (sum, m) => sum + (m.impressions ?? 0),
          0
        ),
        totalClicks: c.metrics.reduce((sum, m) => sum + (m.clicks ?? 0), 0),
        avgCtr: c.metrics.length
          ? c.metrics.reduce((sum, m) => sum + toNumber(m.ctr), 0) /
            c.metrics.length
          : 0,
        avgRoas: c.metrics.length
          ? c.metrics.reduce((sum, m) => sum + toNumber(m.roas), 0) /
            c.metrics.length
          : 0,
      }));
    }

    if (entityType === "region") {
      return prisma.campaignMetric.groupBy({
        by: ["region"],
        where: {
          ...buildDateFilter(dateRange),
          region: { not: null },
        },
        _sum: {
          spend: true,
          impressions: true,
          clicks: true,
          purchases: true,
        },
        _avg: {
          ctr: true,
          roas: true,
        },
        orderBy: {
          _sum: { [metric === "roas" ? "purchases" : metric]: "desc" },
        },
        take: limit,
      });
    }

    // Default: return raw metrics
    return prisma.campaignMetric.findMany({
      where: buildDateFilter(dateRange),
      orderBy: orderByField,
      take: limit,
      include: {
        campaign: {
          select: { name: true, platform: true },
        },
      },
    });
  },

  // ============ PAGINATED REPORT ============
  async getReport(input: GetReportInput) {
    const { filters, aggregation, sort, pagination } = input;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignMetricWhereInput = {
      ...(filters?.dateRange ? buildDateFilter(filters.dateRange) : {}),
      ...(filters?.platforms?.length
        ? { campaign: { platform: { in: filters.platforms } } }
        : {}),
      ...(filters?.regions?.length ? { region: { in: filters.regions } } : {}),
      ...(filters?.campaignIds?.length
        ? { campaignId: { in: filters.campaignIds } }
        : {}),
    };

    const orderBy: Prisma.CampaignMetricOrderByWithRelationInput = sort
      ? { [sort.field]: sort.order }
      : { reportDate: "desc" };

    const [items, total] = await Promise.all([
      prisma.campaignMetric.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              platform: true,
              objective: true,
            },
          },
        },
      }),
      prisma.campaignMetric.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        spend: toNumber(item.spend),
        ctr: toNumber(item.ctr),
        cpm: toNumber(item.cpm),
        cpc: toNumber(item.cpc),
        costPerResult: toNumber(item.costPerResult),
        purchaseValue: toNumber(item.purchaseValue),
        roas: toNumber(item.roas),
        videoViewRate: toNumber(item.videoViewRate),
        viewThroughRate: toNumber(item.viewThroughRate),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
    };
  },

  // ============ MONTHLY SUMMARIES ============
  async getMonthlySummaries(year: number) {
    return prisma.monthlySummary.findMany({
      where: {
        month: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      orderBy: [{ month: "asc" }, { platform: "asc" }],
    });
  },

  // ============ AVAILABLE FILTERS ============
  async getAvailableFilters() {
    const [platforms, regions, campaigns] = await Promise.all([
      prisma.campaign.findMany({
        select: { platform: true },
        distinct: ["platform"],
      }),
      prisma.campaignMetric.findMany({
        select: { region: true },
        distinct: ["region"],
        where: { region: { not: null } },
      }),
      prisma.campaign.findMany({
        select: { id: true, name: true, platform: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      platforms: platforms.map((p) => p.platform),
      regions: regions.map((r) => r.region).filter(Boolean) as string[],
      campaigns: campaigns,
    };
  },
};
