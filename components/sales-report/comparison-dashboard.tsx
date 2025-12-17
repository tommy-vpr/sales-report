// components/sales-report/comparison-dashboard.tsx
"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  useComparison,
  type PlatformComparison,
  type ComparisonParams,
} from "@/hooks/use-comparison";
import { useReportPeriods } from "@/hooks/use-import";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  ChevronDown,
  BarChart3,
  GitCompare,
  Loader2,
  ShoppingCart,
  Percent,
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

function formatChange(value: number | null): string {
  if (value === null) return "N/A";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
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
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ============ CHANGE INDICATOR ============

function ChangeIndicator({
  value,
  inverted = false,
}: {
  value: number | null;
  inverted?: boolean;
}) {
  if (value === null) return <span className="text-zinc-500">—</span>;

  const isPositive = inverted ? value < 0 : value >= 0;
  const color = isPositive ? "text-emerald-400" : "text-rose-400";
  const Icon = value === 0 ? Minus : value > 0 ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon size={14} />
      {formatChange(value)}
    </span>
  );
}

// ============ MONTH SELECTOR ============

interface MonthSelectorProps {
  label: string;
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  availableYears: number[];
  availableMonths: { month: number; monthName: string }[];
  color: string;
}

function MonthSelector({
  label,
  year,
  month,
  onYearChange,
  onMonthChange,
  availableYears,
  availableMonths,
  color,
}: MonthSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-zinc-400">{label}</span>
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <select
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="
              appearance-none px-4 py-2.5 pr-10 rounded-xl
              bg-white/5border border-white/1
              text-white font-medium text-sm
              cursor-pointer transition-all
              hover:bg-white/8
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
            "
          >
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-zinc-900">
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            size={16}
          />
        </div>
        <div className="relative">
          <select
            value={month}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            className="
              appearance-none px-4 py-2.5 pr-10 rounded-xl
              bg-white/5border border-white/1
              text-white font-medium text-sm
              cursor-pointer transition-all
              hover:bg-white/8
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
            "
          >
            {availableMonths.length > 0 ? (
              availableMonths.map((m) => (
                <option key={m.month} value={m.month} className="bg-zinc-900">
                  {m.monthName}
                </option>
              ))
            ) : (
              <option value={month} className="bg-zinc-900">
                {new Date(year, month - 1).toLocaleString("en-US", {
                  month: "long",
                })}
              </option>
            )}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            size={16}
          />
        </div>
      </div>
    </div>
  );
}

// ============ COMPARISON METRIC CARD ============

interface ComparisonMetricCardProps {
  title: string;
  period1Value: string;
  period2Value: string;
  change: number | null;
  icon: React.ReactNode;
  inverted?: boolean;
}

function ComparisonMetricCard({
  title,
  period1Value,
  period2Value,
  change,
  icon,
  inverted = false,
}: ComparisonMetricCardProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-white/5text-zinc-400">{icon}</div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-zinc-500">Period 1</span>
          </div>
          <p className="text-xl font-bold text-zinc-400">{period1Value}</p>
        </div>
        <ArrowRight className="text-zinc-600" size={20} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">Period 2</span>
          </div>
          <p className="text-xl font-bold text-white">{period2Value}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-white/6">
        <ChangeIndicator value={change} inverted={inverted} />
      </div>
    </GlassCard>
  );
}

// ============ PLATFORM COMPARISON CHART ============

function PlatformComparisonChart({ data }: { data: PlatformComparison[] }) {
  const chartData = data.map((p) => ({
    name: platformDisplayNames[p.platform] || p.platform,
    "Period 1": p.period1.spend,
    "Period 2": p.period2.spend,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(24, 24, 27, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            formatter={(value: number | undefined) => [
              value !== undefined ? `$${value.toFixed(2)}` : "$0.00",
              "",
            ]}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className="text-zinc-400 text-sm">{value}</span>
            )}
          />
          <Bar dataKey="Period 1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Period 2" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ PLATFORM COMPARISON TABLE ============

function PlatformComparisonTable({ data }: { data: PlatformComparison[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/6">
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Platform
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              colSpan={2}
            >
              Spend
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              colSpan={2}
            >
              Revenue
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              colSpan={2}
            >
              ROAS
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              colSpan={2}
            >
              Purchases
            </th>
          </tr>
          <tr className="border-b border-white/4">
            <th></th>
            <th className="px-4 py-2 text-right text-xs text-blue-400">P1</th>
            <th className="px-4 py-2 text-right text-xs text-emerald-400">
              P2 / Δ
            </th>
            <th className="px-4 py-2 text-right text-xs text-blue-400">P1</th>
            <th className="px-4 py-2 text-right text-xs text-emerald-400">
              P2 / Δ
            </th>
            <th className="px-4 py-2 text-right text-xs text-blue-400">P1</th>
            <th className="px-4 py-2 text-right text-xs text-emerald-400">
              P2 / Δ
            </th>
            <th className="px-4 py-2 text-right text-xs text-blue-400">P1</th>
            <th className="px-4 py-2 text-right text-xs text-emerald-400">
              P2 / Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((platform) => {
            const color = PLATFORM_COLORS[platform.platform] || "#3b82f6";
            return (
              <tr
                key={platform.platform}
                className="border-b border-white/4 hover:bg-white/2"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-white text-sm">
                      {platformDisplayNames[platform.platform] ||
                        platform.platform}
                    </span>
                  </div>
                </td>
                {/* Spend */}
                <td className="px-4 py-3 text-right text-sm text-zinc-400">
                  {formatCurrency(platform.period1.spend)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-sm text-white">
                    {formatCurrency(platform.period2.spend)}
                  </div>
                  <ChangeIndicator value={platform.changes.spend} />
                </td>
                {/* Revenue */}
                <td className="px-4 py-3 text-right text-sm text-zinc-400">
                  {formatCurrency(platform.period1.revenue)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-sm text-white">
                    {formatCurrency(platform.period2.revenue)}
                  </div>
                  <ChangeIndicator value={platform.changes.revenue} />
                </td>
                {/* ROAS */}
                <td className="px-4 py-3 text-right text-sm text-zinc-400">
                  {formatRoas(platform.period1.roas)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-sm text-white">
                    {formatRoas(platform.period2.roas)}
                  </div>
                  <ChangeIndicator value={platform.changes.roas} />
                </td>
                {/* Purchases */}
                <td className="px-4 py-3 text-right text-sm text-zinc-400">
                  {formatNumber(platform.period1.purchases)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-sm text-white">
                    {formatNumber(platform.period2.purchases)}
                  </div>
                  <ChangeIndicator value={platform.changes.purchases} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============ MAIN COMPARISON DASHBOARD ============

export function ComparisonDashboard() {
  const { data: periodsData, isLoading: periodsLoading } = useReportPeriods();

  // Default to comparing first two available months
  const [month1, setMonth1] = useState({ year: 2025, month: 1 });
  const [month2, setMonth2] = useState({ year: 2025, month: 2 });

  // Update defaults when periods load
  useMemo(() => {
    if (periodsData?.periods && periodsData.periods.length >= 2) {
      const sorted = [...periodsData.periods].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      if (sorted.length >= 2) {
        setMonth1({ year: sorted[0].year, month: sorted[0].month });
        setMonth2({ year: sorted[1].year, month: sorted[1].month });
      } else if (sorted.length === 1) {
        setMonth1({ year: sorted[0].year, month: sorted[0].month });
        setMonth2({ year: sorted[0].year, month: sorted[0].month });
      }
    }
  }, [periodsData]);

  const comparisonParams: ComparisonParams | null = useMemo(
    () => ({
      month1Year: month1.year,
      month1Month: month1.month,
      month2Year: month2.year,
      month2Month: month2.month,
    }),
    [month1, month2]
  );

  const { data: comparisonData, isLoading: comparisonLoading } =
    useComparison(comparisonParams);

  const availableYears = periodsData?.years || [2025];
  const availableMonthsForYear = (year: number) => {
    if (!periodsData?.periods) return [];
    return periodsData.periods
      .filter((p) => p.year === year)
      .map((p) => ({ month: p.month, monthName: p.monthName }));
  };

  const comparison = comparisonData?.success ? comparisonData.data : null;
  const isLoading = periodsLoading || comparisonLoading;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-500/20 to-emerald-500/20">
            <GitCompare className="text-blue-400" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white">Period Comparison</h1>
        </div>
        <p className="text-zinc-500">Compare performance between two months</p>
      </header>

      {/* Period Selectors */}
      <GlassCard className="p-6 mb-8">
        <div className="flex flex-wrap items-end gap-8">
          <MonthSelector
            label="Period 1 (Baseline)"
            year={month1.year}
            month={month1.month}
            onYearChange={(year) => setMonth1({ ...month1, year })}
            onMonthChange={(month) => setMonth1({ ...month1, month })}
            availableYears={availableYears}
            availableMonths={availableMonthsForYear(month1.year)}
            color="#3b82f6"
          />

          <div className="flex items-center pb-2">
            <ArrowRight className="text-zinc-600" size={24} />
          </div>

          <MonthSelector
            label="Period 2 (Compare)"
            year={month2.year}
            month={month2.month}
            onYearChange={(year) => setMonth2({ ...month2, year })}
            onMonthChange={(month) => setMonth2({ ...month2, month })}
            availableYears={availableYears}
            availableMonths={availableMonthsForYear(month2.year)}
            color="#10b981"
          />

          {comparison && (
            <div className="ml-auto text-right">
              <p className="text-sm text-zinc-400">Comparing</p>
              <p className="text-lg font-semibold text-white">
                {comparison.period1.label} → {comparison.period2.label}
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-zinc-400" size={40} />
        </div>
      ) : comparison ? (
        <>
          {/* Summary Cards - Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            <ComparisonMetricCard
              title="Total Spend"
              period1Value={formatCurrency(
                comparison.period1.totals.totalSpend
              )}
              period2Value={formatCurrency(
                comparison.period2.totals.totalSpend
              )}
              change={comparison.changes.totalSpend}
              icon={<DollarSign size={18} />}
            />
            <ComparisonMetricCard
              title="Total Revenue"
              period1Value={formatCurrency(
                comparison.period1.totals.totalRevenue
              )}
              period2Value={formatCurrency(
                comparison.period2.totals.totalRevenue
              )}
              change={comparison.changes.totalRevenue}
              icon={<TrendingUp size={18} />}
            />
            <ComparisonMetricCard
              title="Avg ROAS"
              period1Value={formatRoas(comparison.period1.totals.avgRoas)}
              period2Value={formatRoas(comparison.period2.totals.avgRoas)}
              change={comparison.changes.avgRoas}
              icon={<Percent size={18} />}
            />
          </div>

          {/* Summary Cards - Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <ComparisonMetricCard
              title="Purchases"
              period1Value={formatNumber(
                comparison.period1.totals.totalPurchases
              )}
              period2Value={formatNumber(
                comparison.period2.totals.totalPurchases
              )}
              change={comparison.changes.totalPurchases}
              icon={<ShoppingCart size={18} />}
            />
            <ComparisonMetricCard
              title="Impressions"
              period1Value={formatNumber(
                comparison.period1.totals.totalImpressions
              )}
              period2Value={formatNumber(
                comparison.period2.totals.totalImpressions
              )}
              change={comparison.changes.totalImpressions}
              icon={<Eye size={18} />}
            />
            <ComparisonMetricCard
              title="Avg CTR"
              period1Value={formatPercent(comparison.period1.totals.avgCtr)}
              period2Value={formatPercent(comparison.period2.totals.avgCtr)}
              change={comparison.changes.avgCtr}
              icon={<Target size={18} />}
            />
          </div>

          {/* Chart */}
          <GlassCard className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-500/20">
                <BarChart3 className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Spend by Platform
                </h3>
                <p className="text-sm text-zinc-500">Side-by-side comparison</p>
              </div>
            </div>
            <PlatformComparisonChart data={comparison.platformComparison} />
          </GlassCard>

          {/* Detailed Table */}
          <GlassCard className="overflow-hidden">
            <div className="p-6 border-b border-white/6">
              <h3 className="text-lg font-semibold text-white">
                Platform Details
              </h3>
              <p className="text-sm text-zinc-500">
                Full breakdown with period-over-period changes
              </p>
            </div>
            <PlatformComparisonTable data={comparison.platformComparison} />
          </GlassCard>
        </>
      ) : (
        <GlassCard className="p-12 text-center">
          <GitCompare className="mx-auto text-zinc-600 mb-4" size={48} />
          <p className="text-zinc-400">Select two periods to compare</p>
          <p className="text-sm text-zinc-600 mt-2">
            Import data first if no periods are available
          </p>
        </GlassCard>
      )}
    </div>
  );
}
