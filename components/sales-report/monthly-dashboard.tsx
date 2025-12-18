// components/sales-report/monthly-dashboard.tsx
"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useMonthlySummary,
  type PlatformBreakdown,
  type MonthlyTrend,
} from "@/hooks/use-monthly-summary";
import { ImportButton } from "./import-csv";
import { PeriodFilter } from "./period-filter";
import type { DateRange } from "@/lib/schemas/sales-report";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointerClick,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Users,
  ShoppingCart,
  Percent,
  Target,
} from "lucide-react";

// ============ PLATFORM COLORS ============

const PLATFORM_COLORS: Record<string, string> = {
  META: "#3b82f6",
  X: "#71717a",
  TIKTOK: "#ec4899",
  LINKEDIN: "#0ea5e9",
  TABOOLA: "#f97316",
  VIBE_CTV: "#a855f7",
  WHOLESALE_CENTRAL: "#10b981",
};

const platformDisplayNames: Record<string, string> = {
  META: "Meta",
  X: "X",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  TABOOLA: "Taboola",
  VIBE_CTV: "Vibe CTV",
  WHOLESALE_CENTRAL: "Wholesale Central",
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
  return `${(value * 100).toFixed(2)}%`;
}

function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`;
}

// ============ GLASS CARD ============

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
        bg-white/3 backdrop-blur-xl
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

// ============ METRIC CARD ============

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = "#3b82f6",
}: MetricCardProps) {
  return (
    <GlassCard className="p-6 group">
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: accentColor }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs md:text-sm font-medium text-zinc-400 tracking-wide uppercase">
            {title}
          </span>
          <div
            className="p-2 rounded-xl bg-white/5"
            style={{ color: accentColor }}
          >
            {icon}
          </div>
        </div>
        <p className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-1">
          {value}
        </p>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
    </GlassCard>
  );
}

// ============ SECTION HEADER ============

function SectionHeader({
  icon,
  title,
  subtitle,
  iconBg = "from-blue-500/20 to-purple-500/20",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
}) {
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

// ============ CUSTOM TOOLTIP ============

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-zinc-300">{entry.name}:</span>
          <span className="text-sm font-semibold text-white">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============ SPEND TREND CHART ============

function SpendTrendChart({ data }: { data: MonthlyTrend[] }) {
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center text-zinc-500">
        No trend data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: new Date(d.month).toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    spend: d.totalSpend,
    revenue: d.totalRevenue,
    impressions: d.totalImpressions,
    clicks: d.totalClicks,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={(v) =>
              `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
            }
            width={60}
          />
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
          <Legend
            formatter={(value) => (
              <span className="text-zinc-400 text-sm">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="spend"
            name="Spend"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#spendGradient)"
            dot={{ r: 3, fill: "#3b82f6", stroke: "#fff", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ r: 3, fill: "#10b981", stroke: "#fff", strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ PLATFORM PIE CHART ============

function PlatformPieChart({ data }: { data: PlatformBreakdown[] }) {
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center text-zinc-500">
        No platform data available
      </div>
    );
  }

  const chartData = data.map((p) => ({
    name: platformDisplayNames[p.platform] || p.platform,
    value: p.totalSpend,
    fill: PLATFORM_COLORS[p.platform] || "#3b82f6",
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as {
                name: string;
                value: number;
              };
              const percent = ((item.value / total) * 100).toFixed(1);
              return (
                <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 shadow-xl">
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-sm text-zinc-400">
                    {formatCurrency(item.value)} ({percent}%)
                  </p>
                </div>
              );
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => (
              <span className="text-zinc-300 text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ PLATFORM BAR CHART ============

function PlatformBarChart({ data }: { data: PlatformBreakdown[] }) {
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center text-zinc-500">
        No platform data available
      </div>
    );
  }

  const chartData = data.map((p) => ({
    name: platformDisplayNames[p.platform] || p.platform,
    spend: p.totalSpend,
    revenue: p.totalRevenue,
    fill: PLATFORM_COLORS[p.platform] || "#3b82f6",
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            horizontal={false}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={formatCurrency}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
          <Legend
            formatter={(value) => (
              <span className="text-zinc-400 text-sm">{value}</span>
            )}
          />
          <Bar dataKey="spend" name="Spend" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ PLATFORM TABLE ============

function PlatformTable({ data }: { data: PlatformBreakdown[] }) {
  if (!data.length) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No platform data available. Import a report to get started.
      </div>
    );
  }

  return (
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
              Revenue
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              ROAS
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Purchases
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              CTR
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              CPM
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((platform) => {
            const color = PLATFORM_COLORS[platform.platform] || "#3b82f6";
            return (
              <tr
                key={platform.platform}
                className="border-b border-white/4 hover:bg-white/2 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-white">
                      {platformDisplayNames[platform.platform] ||
                        platform.platform}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-white">
                  {formatCurrency(platform.totalSpend)}
                </td>
                <td className="px-6 py-4 text-right text-emerald-400 font-semibold">
                  {formatCurrency(platform.totalRevenue)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={
                      platform.avgRoas >= 1
                        ? "text-emerald-400"
                        : "text-zinc-400"
                    }
                  >
                    {formatRoas(platform.avgRoas)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-zinc-300">
                  {formatNumber(platform.totalPurchases)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={
                      platform.avgCtr > 0.02
                        ? "text-emerald-400"
                        : "text-zinc-400"
                    }
                  >
                    {formatPercent(platform.avgCtr)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-zinc-300">
                  {formatCurrency(platform.avgCpm)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${platform.spendShare}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="text-zinc-400 text-sm w-12 text-right">
                      {platform.spendShare.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============ MAIN DASHBOARD ============

export function MonthlyDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date("2025-01-01"),
    endDate: new Date(),
  });

  // Extract year and month from date range for filtering
  const filters = {
    startYear: dateRange.startDate.getFullYear(),
    startMonth: dateRange.startDate.getMonth() + 1,
    endYear: dateRange.endDate.getFullYear(),
    endMonth: dateRange.endDate.getMonth() + 1,
  };

  const { data, isLoading, error } = useMonthlySummary(filters);
  const summaryData = data?.success ? data.data : null;

  console.log("Repo, Service, Action: ", data);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Monthly Summary</h1>
          <p className="text-zinc-500 mt-1">
            Aggregated performance by month and platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <PeriodFilter value={dateRange} onChange={setDateRange} />
          </div>
          <ImportButton />
        </div>
      </header>

      {error && (
        <GlassCard className="p-6 mb-8 border-rose-500/30">
          <p className="text-rose-400">Failed to load dashboard data</p>
        </GlassCard>
      )}

      {/* KPI Cards - Row 1: Spend & Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-36 bg-white/3 rounded-2xl animate-pulse"
            />
          ))
        ) : summaryData ? (
          <>
            <MetricCard
              title="Total Spend"
              value={formatCurrency(summaryData.totals.totalSpend)}
              subtitle={`${summaryData.totals.campaignCount} campaigns`}
              icon={<DollarSign size={20} />}
              accentColor="#3b82f6"
            />
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(summaryData.totals.totalRevenue)}
              subtitle={`${summaryData.totals.totalPurchases} purchases`}
              icon={<TrendingUp size={20} />}
              accentColor="#10b981"
            />
            <MetricCard
              title="Avg ROAS"
              value={formatRoas(summaryData.totals.avgRoas)}
              subtitle="Return on ad spend"
              icon={<Percent size={20} />}
              accentColor="#f59e0b"
            />
            <MetricCard
              title="Purchases"
              value={formatNumber(summaryData.totals.totalPurchases)}
              subtitle={`${formatCurrency(summaryData.totals.avgCpc)} CPC`}
              icon={<ShoppingCart size={20} />}
              accentColor="#8b5cf6"
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

      {/* KPI Cards - Row 2: Engagement */}
      {!isLoading && summaryData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <MetricCard
            title="Impressions"
            value={formatNumber(summaryData.totals.totalImpressions)}
            subtitle={`${formatCurrency(summaryData.totals.avgCpm)} CPM`}
            icon={<Eye size={20} />}
            accentColor="#06b6d4"
          />
          <MetricCard
            title="Clicks"
            value={formatNumber(summaryData.totals.totalClicks)}
            subtitle={`${formatCurrency(summaryData.totals.avgCpc)} CPC`}
            icon={<MousePointerClick size={20} />}
            accentColor="#ec4899"
          />
          <MetricCard
            title="Avg CTR"
            value={formatPercent(summaryData.totals.avgCtr)}
            subtitle={`${summaryData.platformBreakdown.length} platforms`}
            icon={<Target size={20} />}
            accentColor="#f97316"
          />
          <MetricCard
            title="Video Views"
            value={formatNumber(summaryData.totals.totalVideoViews)}
            subtitle="Total video views"
            icon={<Eye size={20} />}
            accentColor="#a855f7"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassCard className="p-6">
          <SectionHeader
            icon={<Zap className="text-blue-400" size={20} />}
            title="Spend & Revenue Trend"
            subtitle="Monthly performance over time"
          />
          <SpendTrendChart data={summaryData?.monthlyTrend || []} />
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeader
            icon={<PieChartIcon className="text-purple-400" size={20} />}
            title="Spend by Platform"
            subtitle="Distribution across platforms"
            iconBg="from-purple-500/20 to-pink-500/20"
          />
          <PlatformPieChart data={summaryData?.platformBreakdown || []} />
        </GlassCard>
      </div>

      {/* Platform Bar Chart */}
      <GlassCard className="p-6 mb-8">
        <SectionHeader
          icon={<BarChart3 className="text-emerald-400" size={20} />}
          title="Platform Comparison"
          subtitle="Spend by platform"
          iconBg="from-emerald-500/20 to-teal-500/20"
        />
        <PlatformBarChart data={summaryData?.platformBreakdown || []} />
      </GlassCard>

      {/* Platform Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-white/6">
          <SectionHeader
            icon={<Users className="text-amber-400" size={20} />}
            title="Platform Performance"
            subtitle="Detailed breakdown by platform"
            iconBg="from-amber-500/20 to-orange-500/20"
          />
        </div>
        <PlatformTable data={summaryData?.platformBreakdown || []} />
      </GlassCard>
    </div>
  );
}
