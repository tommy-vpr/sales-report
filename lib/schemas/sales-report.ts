// lib/schemas/sales-report.ts
import { z } from "zod";

// Enums matching Prisma
export const PlatformSchema = z.enum([
  "META",
  "X",
  "TIKTOK",
  "LINKEDIN",
  "TABOOLA",
  "VIBE_CTV",
  "WHOLESALE_CENTRAL",
]);

export const ObjectiveTypeSchema = z.enum([
  "REACH",
  "LINK_CLICKS",
  "VIDEO_VIEWS",
  "WEBSITE_TRAFFIC",
  "BRAND_AWARENESS",
  "OUTCOME_AWARENESS",
]);

// Base metric schema (shared fields)
const BaseMetricSchema = z.object({
  reportDate: z.coerce.date(),
  region: z.string().nullable().optional(),
  reach: z.number().int().nullable().optional(),
  impressions: z.number().int(),
  clicks: z.number().int().nullable().optional(),
  spend: z.number(),
  ctr: z.number().nullable().optional(),
  cpm: z.number().nullable().optional(),
  cpc: z.number().nullable().optional(),
});

// Campaign metric schema
export const CampaignMetricSchema = BaseMetricSchema.extend({
  id: z.string(),
  campaignId: z.string(),
  videoViews: z.number().int().nullable().optional(),
  videoViewRate: z.number().nullable().optional(),
  videoCompletions: z.number().int().nullable().optional(),
  results: z.number().int().nullable().optional(),
  resultType: z.string().nullable().optional(),
  costPerResult: z.number().nullable().optional(),
  purchases: z.number().int().nullable().optional(),
  purchaseValue: z.number().nullable().optional(),
  roas: z.number().nullable().optional(),
  addToCart: z.number().int().nullable().optional(),
  checkouts: z.number().int().nullable().optional(),
  households: z.number().int().nullable().optional(),
  viewThroughRate: z.number().nullable().optional(),
  completedViews: z.number().int().nullable().optional(),
  sessions: z.number().int().nullable().optional(),
  pageViews: z.number().int().nullable().optional(),
  leads: z.number().int().nullable().optional(),
});

// Campaign schema
export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: PlatformSchema,
  objective: ObjectiveTypeSchema.nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  totalBudget: z.number().nullable().optional(),
  dailyBudget: z.number().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Monthly summary schema
export const MonthlySummarySchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  month: z.coerce.date(),
  totalSpend: z.number(),
  totalImpressions: z.number(),
  totalClicks: z.number().nullable().optional(),
  totalReach: z.number().nullable().optional(),
  avgCtr: z.number().nullable().optional(),
  avgCpm: z.number().nullable().optional(),
  avgCpc: z.number().nullable().optional(),
  totalVideoViews: z.number().nullable().optional(),
  totalPurchases: z.number().int().nullable().optional(),
  totalRevenue: z.number().nullable().optional(),
  avgRoas: z.number().nullable().optional(),
  campaignCount: z.number().int(),
});

// ============ INPUT SCHEMAS ============

// Date range filter
export const DateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// Report filters
export const ReportFiltersSchema = z.object({
  platforms: z.array(PlatformSchema).optional(),
  dateRange: DateRangeSchema.optional(),
  regions: z.array(z.string()).optional(),
  campaignIds: z.array(z.string()).optional(),
  objectives: z.array(ObjectiveTypeSchema).optional(),
});

// Aggregation type
export const AggregationTypeSchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "quarterly",
]);

// Sort options
export const SortFieldSchema = z.enum([
  "spend",
  "impressions",
  "clicks",
  "ctr",
  "cpm",
  "cpc",
  "roas",
  "purchases",
  "reportDate",
]);

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const SortOptionsSchema = z.object({
  field: SortFieldSchema,
  order: SortOrderSchema,
});

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Get report input
export const GetReportInputSchema = z.object({
  filters: ReportFiltersSchema.optional(),
  aggregation: AggregationTypeSchema.default("daily"),
  sort: SortOptionsSchema.optional(),
  pagination: PaginationSchema.optional(),
});

// Platform overview input
export const GetPlatformOverviewSchema = z.object({
  dateRange: DateRangeSchema,
  compareWith: DateRangeSchema.optional(), // For comparison periods
});

// Campaign performance input
export const GetCampaignPerformanceSchema = z.object({
  campaignId: z.string().optional(),
  dateRange: DateRangeSchema,
  groupBy: z.enum(["region", "day", "week"]).default("day"),
});

// Regional breakdown input
export const GetRegionalBreakdownSchema = z.object({
  dateRange: DateRangeSchema,
  platforms: z.array(PlatformSchema).optional(),
  metric: z
    .enum(["spend", "impressions", "clicks", "conversions"])
    .default("spend"),
  limit: z.number().int().min(1).max(50).default(10),
});

// Top performers input
export const GetTopPerformersSchema = z.object({
  dateRange: DateRangeSchema,
  metric: SortFieldSchema,
  entityType: z.enum(["campaign", "adSet", "ad", "region"]),
  limit: z.number().int().min(1).max(20).default(10),
});

// Trend analysis input
export const GetTrendAnalysisSchema = z.object({
  dateRange: DateRangeSchema,
  metrics: z.array(z.enum(["spend", "impressions", "ctr", "cpm", "roas"])),
  groupBy: AggregationTypeSchema.default("daily"),
  platforms: z.array(PlatformSchema).optional(),
});

// ============ OUTPUT/RESPONSE SCHEMAS ============

// Platform summary for dashboard
export const PlatformSummarySchema = z.object({
  platform: PlatformSchema,
  totalSpend: z.number(),
  totalImpressions: z.number(),
  totalClicks: z.number(),
  avgCtr: z.number(),
  avgCpm: z.number(),
  avgCpc: z.number(),
  totalPurchases: z.number().optional(),
  totalRevenue: z.number().optional(),
  avgRoas: z.number().optional(),
  campaignCount: z.number(),
  // Change metrics (vs previous period)
  spendChange: z.number().optional(),
  impressionsChange: z.number().optional(),
  ctrChange: z.number().optional(),
});

// Regional performance
export const RegionalPerformanceSchema = z.object({
  region: z.string(),
  totalSpend: z.number(),
  totalImpressions: z.number(),
  totalClicks: z.number(),
  avgCtr: z.number(),
  avgCpm: z.number(),
  purchases: z.number().optional(),
  percentOfTotal: z.number(),
});

// Time series data point
export const TimeSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  metric: z.string(),
});

// Add this to your schemas file:
export const AvailableFiltersSchema = z.object({
  platforms: z.array(PlatformSchema),
  regions: z.array(z.string()),
  campaigns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      platform: PlatformSchema,
    })
  ),
});

// Dashboard overview response
export const DashboardOverviewSchema = z.object({
  totalSpend: z.number(),
  totalImpressions: z.number(),
  totalClicks: z.number(),
  avgCtr: z.number(),
  avgCpm: z.number(),
  avgCpc: z.number(),
  totalPurchases: z.number(),
  totalRevenue: z.number(),
  avgRoas: z.number(),
  platformBreakdown: z.array(PlatformSummarySchema),
  topRegions: z.array(RegionalPerformanceSchema),
  spendTrend: z.array(TimeSeriesPointSchema),
  // Period comparison
  previousPeriod: z
    .object({
      totalSpend: z.number(),
      totalImpressions: z.number(),
      totalClicks: z.number(),
    })
    .optional(),
});

// Paginated response wrapper
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasMore: z.boolean(),
    }),
  });

// lib/schemas/sales-report.ts

// Add this type for report rows with campaign relation
export const ReportRowSchema = CampaignMetricSchema.extend({
  campaign: z
    .object({
      id: z.string(),
      name: z.string(),
      platform: PlatformSchema,
      objective: ObjectiveTypeSchema.nullable().optional(),
    })
    .nullable()
    .optional(),
});

// Update the paginated report response type
export const ReportResponseSchema = z.object({
  items: z.array(ReportRowSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
  }),
});

// ============ TYPES ============

export type Platform = z.infer<typeof PlatformSchema>;
export type ObjectiveType = z.infer<typeof ObjectiveTypeSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignMetric = z.infer<typeof CampaignMetricSchema>;
export type MonthlySummary = z.infer<typeof MonthlySummarySchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type ReportFilters = z.infer<typeof ReportFiltersSchema>;
export type GetReportInput = z.infer<typeof GetReportInputSchema>;
export type GetPlatformOverviewInput = z.infer<
  typeof GetPlatformOverviewSchema
>;
export type GetCampaignPerformanceInput = z.infer<
  typeof GetCampaignPerformanceSchema
>;
export type GetRegionalBreakdownInput = z.infer<
  typeof GetRegionalBreakdownSchema
>;
export type GetTopPerformersInput = z.infer<typeof GetTopPerformersSchema>;
export type GetTrendAnalysisInput = z.infer<typeof GetTrendAnalysisSchema>;
export type PlatformSummary = z.infer<typeof PlatformSummarySchema>;
export type RegionalPerformance = z.infer<typeof RegionalPerformanceSchema>;
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;
export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;
export type SortOptions = z.infer<typeof SortOptionsSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type AvailableFilters = z.infer<typeof AvailableFiltersSchema>;
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
export type ReportRow = z.infer<typeof ReportRowSchema>;
