// components/sales-report/dashboard-overview.tsx
"use client";

import { useState, useMemo } from "react";
import {
  useDashboardOverview,
  usePlatformBreakdown,
  useRegionalBreakdown,
} from "@/hooks/use-sales-report";
import {
  SpendTrendChart,
  PlatformPieChart,
  PerformanceComparisonChart,
} from "./Charts";
import { ImportButton } from "./import-csv";
import { PeriodFilter } from "./period-filter";
import type {
  DateRange,
  PlatformSummary,
  RegionalPerformance,
} from "@/lib/schemas/sales-report";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  BarChart3,
  Globe2,
  Zap,
  PieChart,
} from "lucide-react";

// ============ PLATFORM COLORS ============

const platformColors: Record<
  string,
  { bg: string; text: string; accent: string }
> = {
  META: { bg: "bg-blue-500/20", text: "text-blue-400", accent: "#3b82f6" },
  X: { bg: "bg-zinc-500/20", text: "text-zinc-300", accent: "#a1a1aa" },
  TIKTOK: { bg: "bg-pink-500/20", text: "text-pink-400", accent: "#ec4899" },
  LINKEDIN: { bg: "bg-sky-500/20", text: "text-sky-400", accent: "#0ea5e9" },
  TABOOLA: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    accent: "#f97316",
  },
  VIBE_CTV: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    accent: "#a855f7",
  },
  WHOLESALE_CENTRAL: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    accent: "#10b981",
  },
};

// ============ FORMAT HELPERS ============

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

// ============ GLASS CARD COMPONENT ============

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl 
        bg-white/3backdrop-blur-xl
        border border-white/8
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        transition-all duration-300
        hover:bg-white/5 hover:border-white/12
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ============ METRIC CARD COMPONENT ============

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  accentColor?: string;
}

function MetricCard({
  title,
  value,
  change,
  icon,
  accentColor = "#3b82f6",
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <GlassCard className="p-6 group">
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: accentColor }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-400 tracking-wide uppercase">
            {title}
          </span>
          <div
            className="p-2 rounded-xl bg-white/5"
            style={{ color: accentColor }}
          >
            {icon}
          </div>
        </div>

        <p className="text-4xl font-bold text-white tracking-tight mb-2">
          {value}
        </p>

        {change !== undefined && !isNaN(change) && isFinite(change) && (
          <div
            className={`flex items-center gap-1.5 text-sm ${
              isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="font-medium">{formatPercent(change)}</span>
            <span className="text-zinc-500">vs prev</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ============ SECTION HEADER ============

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
}

function SectionHeader({
  icon,
  title,
  subtitle,
  iconBg = "from-blue-500/20 to-purple-500/20",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2.5 rounded-xl bg-linear-to-br ${iconBg}`}>{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ============ PLATFORM TABLE ============

interface PlatformTableProps {
  dateRange: DateRange;
}

function PlatformBreakdownTable({ dateRange }: PlatformTableProps) {
  const { data, isLoading, error } = usePlatformBreakdown(dateRange);

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (error || !data?.success || data.data.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-zinc-400">
          No platform data available. Import a report to get started.
        </p>
      </GlassCard>
    );
  }

  console.log(data.data);

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b border-white/6">
        <SectionHeader
          icon={<BarChart3 className="text-blue-400" size={20} />}
          title="Platform Performance"
          subtitle="Breakdown by advertising platform"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Spend
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Impressions
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                CTR
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                CPM
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ROAS
              </th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((platform: PlatformSummary) => {
              const colors =
                platformColors[platform.platform] || platformColors.META;
              return (
                <tr
                  key={platform.platform}
                  className="border-b border-white/4 hover:bg-white/2 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${colors.bg} ${colors.text}`}
                    >
                      {platform.platform.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-white">
                    {formatCurrency(platform.totalSpend)}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300">
                    {formatNumber(platform.totalImpressions)}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300">
                    {formatNumber(platform.totalClicks)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-medium ${
                        platform.avgCtr > 0.02
                          ? "text-emerald-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {(platform.avgCtr * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300">
                    {formatCurrency(platform.avgCpm)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {platform.avgRoas ? (
                      <span
                        className={`font-bold ${
                          platform.avgRoas > 1
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {platform.avgRoas.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

// ============ REGIONAL BREAKDOWN ============

interface RegionalBreakdownProps {
  dateRange: DateRange;
}

function RegionalBreakdown({ dateRange }: RegionalBreakdownProps) {
  const { data, isLoading } = useRegionalBreakdown({
    dateRange,
    metric: "spend",
    limit: 8,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6 h-full">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!data?.success || data.data.length === 0) {
    return (
      <GlassCard className="p-6 h-full flex items-center justify-center">
        <p className="text-zinc-500 text-sm">No regional data available</p>
      </GlassCard>
    );
  }

  const maxSpend = Math.max(
    ...data.data.map((r: RegionalPerformance) => r.totalSpend)
  );

  return (
    <GlassCard className="p-6 h-full">
      <SectionHeader
        icon={<Globe2 className="text-emerald-400" size={20} />}
        title="Top Regions"
        subtitle="By ad spend"
        iconBg="from-emerald-500/20 to-teal-500/20"
      />

      <div className="space-y-4">
        {data.data.map((region: RegionalPerformance) => {
          const percentage = (region.totalSpend / maxSpend) * 100;
          return (
            <div key={region.region} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  {region.region}
                </span>
                <span className="text-sm font-semibold text-white">
                  {formatCurrency(region.totalSpend)}
                </span>
              </div>
              <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ============ MAIN DASHBOARD COMPONENT ============

export function SalesReportDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date("2025-01-01"),
    endDate: new Date(),
  });

  const previousPeriod = useMemo(() => {
    const duration =
      dateRange.endDate.getTime() - dateRange.startDate.getTime();
    return {
      startDate: new Date(dateRange.startDate.getTime() - duration),
      endDate: new Date(dateRange.startDate.getTime() - 1),
    };
  }, [dateRange]);

  const { data, isLoading, error } = useDashboardOverview({
    dateRange,
    compareWith: previousPeriod,
  });

  const overview = data?.success ? data.data : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-linear-to-br from-blue-600/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-linear-to-tl from-purple-600/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex flex-col gap-4 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Ad Analytics
              </h1>
              <p className="text-zinc-500 mt-1">
                Track performance across all platforms
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <PeriodFilter value={dateRange} onChange={setDateRange} />
              <ImportButton />
            </div>
          </div>
        </header>

        {error && (
          <GlassCard className="p-6 mb-8 border-rose-500/30">
            <p className="text-rose-400">Failed to load dashboard data</p>
          </GlassCard>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-white/3rounded-2xl animate-pulse"
              />
            ))
          ) : overview ? (
            <>
              <MetricCard
                title="Total Spend"
                value={formatCurrency(overview.totalSpend)}
                icon={<DollarSign size={20} />}
                accentColor="#3b82f6"
                change={
                  overview.previousPeriod?.totalSpend
                    ? ((overview.totalSpend -
                        overview.previousPeriod.totalSpend) /
                        overview.previousPeriod.totalSpend) *
                      100
                    : undefined
                }
              />
              <MetricCard
                title="Impressions"
                value={formatNumber(overview.totalImpressions)}
                icon={<Eye size={20} />}
                accentColor="#8b5cf6"
                change={
                  overview.previousPeriod?.totalImpressions
                    ? ((overview.totalImpressions -
                        overview.previousPeriod.totalImpressions) /
                        overview.previousPeriod.totalImpressions) *
                      100
                    : undefined
                }
              />
              <MetricCard
                title="Avg CTR"
                value={`${(overview.avgCtr * 100).toFixed(2)}%`}
                icon={<MousePointerClick size={20} />}
                accentColor="#10b981"
              />
              <MetricCard
                title="Avg ROAS"
                value={`${overview.avgRoas.toFixed(2)}x`}
                icon={<Target size={20} />}
                accentColor="#f59e0b"
              />
            </>
          ) : (
            <GlassCard className="col-span-full p-8 text-center">
              <p className="text-zinc-400">
                No data available. Import a report to get started.
              </p>
            </GlassCard>
          )}
        </div>

        {/* Charts Row 1: Spend Trend + Regions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GlassCard className="p-6">
            <SectionHeader
              icon={<Zap className="text-blue-400" size={20} />}
              title="Spend Trend"
              subtitle="Daily ad spend over time"
            />
            <SpendTrendChart dateRange={dateRange} height={280} />
          </GlassCard>

          <RegionalBreakdown dateRange={dateRange} />
        </div>

        {/* Charts Row 2: Platform Distribution + Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GlassCard className="p-6">
            <SectionHeader
              icon={<PieChart className="text-purple-400" size={20} />}
              title="Spend Distribution"
              subtitle="By platform"
              iconBg="from-purple-500/20 to-pink-500/20"
            />
            <PlatformPieChart
              dateRange={dateRange}
              metric="spend"
              height={280}
            />
          </GlassCard>

          <GlassCard className="p-6">
            <SectionHeader
              icon={<BarChart3 className="text-amber-400" size={20} />}
              title="Performance Comparison"
              subtitle="CTR vs ROAS by platform"
              iconBg="from-amber-500/20 to-orange-500/20"
            />
            <PerformanceComparisonChart dateRange={dateRange} height={280} />
          </GlassCard>
        </div>

        {/* Platform Table */}
        <PlatformBreakdownTable dateRange={dateRange} />
      </div>
    </div>
  );
}
