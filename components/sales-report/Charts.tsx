// components/sales-report/charts.tsx
"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
import type { DateRange, TimeSeriesPoint } from "@/lib/schemas/sales-report";
import {
  useTrendAnalysis,
  usePlatformBreakdown,
} from "@/hooks/use-sales-report";

// ============ COLORS ============

const PLATFORM_COLORS: Record<string, string> = {
  META: "#3b82f6",
  X: "#71717a",
  TIKTOK: "#ec4899",
  LINKEDIN: "#0ea5e9",
  TABOOLA: "#f97316",
  VIBE_CTV: "#a855f7",
  WHOLESALE_CENTRAL: "#10b981",
};

const CHART_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
];

// ============ CUSTOM TOOLTIP ============

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color?: string;
  }>;
  label?: string;
  formatValue?: (value: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
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
            {formatValue ? formatValue(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============ FORMAT HELPERS ============

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// ============ SPEND TREND CHART ============

interface SpendTrendChartProps {
  dateRange: DateRange;
  height?: number;
}

export function SpendTrendChart({
  dateRange,
  height = 300,
}: SpendTrendChartProps) {
  const { data, isLoading } = useTrendAnalysis({
    dateRange,
    metrics: ["spend"],
    groupBy: "daily",
  });

  if (isLoading) {
    return (
      <div className="bg-white/3 rounded-xl animate-pulse" style={{ height }} />
    );
  }

  if (!data?.success || data.data.length === 0) {
    return (
      <div
        className="bg-white/3 rounded-xl flex items-center justify-center text-zinc-500"
        style={{ height }}
      >
        No trend data available
      </div>
    );
  }

  const chartData = data.data.map((d: TimeSeriesPoint) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    spend: d.value,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={formatCurrency}
            tickMargin={10}
            width={60}
          />
          <Tooltip
            content={<CustomTooltip formatValue={(v) => `$${v.toFixed(2)}`} />}
            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            name="Spend"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#spendGradient)"
            dot={false}
            activeDot={{
              r: 6,
              fill: "#3b82f6",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ MULTI-METRIC TREND CHART ============

interface MultiMetricChartProps {
  dateRange: DateRange;
  metrics: ("spend" | "impressions" | "ctr" | "cpm" | "roas")[];
  height?: number;
}

export function MultiMetricChart({
  dateRange,
  metrics,
  height = 300,
}: MultiMetricChartProps) {
  const { data, isLoading } = useTrendAnalysis({
    dateRange,
    metrics,
    groupBy: "daily",
  });

  if (isLoading) {
    return (
      <div className="bg-white/3 rounded-xl animate-pulse" style={{ height }} />
    );
  }

  if (!data?.success || data.data.length === 0) {
    return (
      <div
        className="bg-white/3 rounded-xl flex items-center justify-center text-zinc-500"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Group by date and pivot metrics
  interface MetricDataPoint {
    date: string;
    [metric: string]: string | number;
  }

  const groupedData = data.data.reduce<Record<string, MetricDataPoint>>(
    (acc, point: TimeSeriesPoint) => {
      const dateKey = new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey };
      acc[dateKey][point.metric] = point.value;
      return acc;
    },
    {}
  );

  const chartData = Object.values(groupedData);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickMargin={10}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className="text-zinc-400 text-sm">{value}</span>
            )}
          />
          {metrics.map((metric, index) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              name={metric.toUpperCase()}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ PLATFORM BAR CHART ============

interface PlatformBarChartProps {
  dateRange: DateRange;
  metric?: "spend" | "impressions" | "clicks";
  height?: number;
}

export function PlatformBarChart({
  dateRange,
  metric = "spend",
  height = 300,
}: PlatformBarChartProps) {
  const { data, isLoading } = usePlatformBreakdown(dateRange);

  if (isLoading) {
    return (
      <div className="bg-white/3 rounded-xl animate-pulse" style={{ height }} />
    );
  }

  if (!data?.success || data.data.length === 0) {
    return (
      <div
        className="bg-white/3 rounded-xl flex items-center justify-center text-zinc-500"
        style={{ height }}
      >
        No platform data available
      </div>
    );
  }

  const chartData = data.data.map(
    (p: {
      platform: string;
      totalSpend: number;
      totalImpressions: number;
      totalClicks: number;
    }) => ({
      platform: p.platform.replace("_", " "),
      value:
        metric === "spend"
          ? p.totalSpend
          : metric === "impressions"
          ? p.totalImpressions
          : p.totalClicks,
      fill: PLATFORM_COLORS[p.platform] || "#3b82f6",
    })
  );

  const formatter = metric === "spend" ? formatCurrency : formatNumber;

  return (
    <div style={{ height }}>
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
            tickFormatter={formatter}
          />
          <YAxis
            type="category"
            dataKey="platform"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            width={100}
          />
          <Tooltip
            content={<CustomTooltip formatValue={formatter} />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar
            dataKey="value"
            name={metric.charAt(0).toUpperCase() + metric.slice(1)}
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ PLATFORM PIE CHART ============

interface PlatformPieChartProps {
  dateRange: DateRange;
  metric?: "spend" | "impressions" | "clicks";
  height?: number;
}

export function PlatformPieChart({
  dateRange,
  metric = "spend",
  height = 300,
}: PlatformPieChartProps) {
  const { data, isLoading } = usePlatformBreakdown(dateRange);

  if (isLoading) {
    return (
      <div className="bg-white/3 rounded-xl animate-pulse" style={{ height }} />
    );
  }

  if (!data?.success || data.data.length === 0) {
    return (
      <div
        className="bg-white/3 rounded-xl flex items-center justify-center text-zinc-500"
        style={{ height }}
      >
        No platform data available
      </div>
    );
  }

  const chartData = data.data.map(
    (p: {
      platform: string;
      totalSpend: number;
      totalImpressions: number;
      totalClicks: number;
    }) => ({
      name: p.platform.replace("_", " "),
      value:
        metric === "spend"
          ? p.totalSpend
          : metric === "impressions"
          ? p.totalImpressions
          : p.totalClicks,
      fill: PLATFORM_COLORS[p.platform] || "#3b82f6",
    })
  );

  const formatter = metric === "spend" ? formatCurrency : formatNumber;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ height }}>
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
              const item = payload[0].payload;
              const percent = ((item.value / total) * 100).toFixed(1);
              return (
                <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 shadow-xl">
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-sm text-zinc-400">
                    {formatter(item.value)} ({percent}%)
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

// ============ CTR/ROAS COMPARISON CHART ============

interface PerformanceChartProps {
  dateRange: DateRange;
  height?: number;
}

export function PerformanceComparisonChart({
  dateRange,
  height = 300,
}: PerformanceChartProps) {
  const { data, isLoading } = usePlatformBreakdown(dateRange);

  if (isLoading) {
    return (
      <div className="bg-white/3 rounded-xl animate-pulse" style={{ height }} />
    );
  }

  if (!data?.success || data.data.length === 0) {
    return (
      <div
        className="bg-white/3 rounded-xl flex items-center justify-center text-zinc-500"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const chartData = data.data.map(
    (p: { platform: string; avgCtr: number; avgRoas?: number }) => ({
      platform: p.platform.replace("_", " "),
      CTR: p.avgCtr * 100,
      ROAS: p.avgRoas || 0,
    })
  );

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="platform"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickMargin={10}
          />
          <YAxis
            yAxisId="ctr"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            orientation="left"
          />
          <YAxis
            yAxisId="roas"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(1)}x`}
            orientation="right"
          />
          <Tooltip
            content={({ active, payload, label }) => {
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
                      <span className="text-sm text-zinc-300">
                        {entry.name}:
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {entry.name === "CTR"
                          ? `${(entry.value as number).toFixed(2)}%`
                          : `${(entry.value as number).toFixed(2)}x`}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className="text-zinc-400 text-sm">{value}</span>
            )}
          />
          <Bar
            yAxisId="ctr"
            dataKey="CTR"
            name="CTR"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
          <Bar
            yAxisId="roas"
            dataKey="ROAS"
            name="ROAS"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============ MINI SPARKLINE (for cards) ============

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = "#3b82f6",
  width = 100,
  height = 30,
}: SparklineProps) {
  if (!data.length) return null;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <defs>
            <linearGradient
              id={`sparkline-${color}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#sparkline-${color})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
