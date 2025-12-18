// app/dashboard/import/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useImportCSV, useReportPeriods } from "@/hooks/use-import";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Database,
  TrendingUp,
  Trash2,
  RefreshCw,
} from "lucide-react";

// ============ CONSTANTS ============

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - i + 1
);

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

// ============ IMPORT HISTORY ============

function ImportHistory() {
  const { data: periodsData, isLoading, refetch } = useReportPeriods();
  const periods = periodsData?.periods || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto text-zinc-600 mb-4" size={40} />
        <p className="text-zinc-400">No data imported yet</p>
        <p className="text-sm text-zinc-600 mt-1">
          Upload a CSV file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">
          {periods.length} month{periods.length !== 1 ? "s" : ""} of data
        </p>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {periods.map((period) => (
        <div
          key={`${period.year}-${period.month}`}
          className="
            flex items-center justify-between p-4 rounded-xl
            bg-white/2 border border-white/5
            hover:bg-white/4 transition-colors
          "
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Calendar className="text-emerald-400" size={18} />
            </div>
            <div>
              <p className="font-medium text-white">{period.label}</p>
              <p className="text-sm text-zinc-500">
                {period.platformCount} platform
                {period.platformCount !== 1 ? "s" : ""} • {period.campaignCount}{" "}
                campaign{period.campaignCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-white">
              {formatCurrency(period.totalSpend)}
            </p>
            <p className="text-sm text-zinc-500">
              {formatNumber(period.totalImpressions)} impressions
            </p>
          </div>
        </div>
      ))}

      {/* Totals */}
      {periodsData?.totals && (
        <div className="mt-6 pt-4 border-t border-white/6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total</span>
            <div className="text-right">
              <p className="font-bold text-white">
                {formatCurrency(periodsData.totals.totalSpend)}
              </p>
              <p className="text-sm text-zinc-500">
                {formatNumber(periodsData.totals.totalImpressions)} impressions
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ IMPORT FORM ============

function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [autoDetect, setAutoDetect] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const {
    mutate: importCSV,
    isPending,
    isSuccess,
    isError,
    error,
    data,
    reset,
  } = useImportCSV();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile?.type === "text/csv" ||
        droppedFile?.name.endsWith(".csv")
      ) {
        setFile(droppedFile);
        reset();
      }
    },
    [reset]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        reset();
      }
    },
    [reset]
  );

  const handleImport = () => {
    if (!file) return;

    importCSV({
      file,
      year: autoDetect ? undefined : year,
      month: autoDetect ? undefined : month,
    });
  };

  const handleReset = () => {
    setFile(null);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Success State */}
      {isSuccess && data && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-emerald-500/20">
              <Check className="text-emerald-400" size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-400">Import Successful!</p>
              <p className="text-sm text-zinc-400 mt-1">
                <span className="font-semibold text-white">
                  {data.period.monthName} {data.period.year}
                </span>
                {" — "}
                {data.records.created} created, {data.records.updated} updated
              </p>
              {data.summaries && data.summaries.count > 0 && (
                <p className="text-xs text-zinc-500 mt-2">
                  Monthly summaries updated for:{" "}
                  {data.summaries.platforms.join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-rose-500/20">
              <AlertCircle className="text-rose-400" size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-rose-400">Import Failed</p>
              <p className="text-sm text-zinc-400 mt-1">
                {error instanceof Error
                  ? error.message
                  : "Unknown error occurred"}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      {!isSuccess && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer
              ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-white/1 hover:border-white/2 hover:bg-white/2"
              }
            `}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {file ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/20">
                  <FileSpreadsheet className="text-emerald-400" size={32} />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{file.name}</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB • Ready to import
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    reset();
                  }}
                  className="
                    inline-flex items-center gap-2 px-4 py-2 rounded-lg
                    text-sm text-zinc-400 hover:text-white
                    hover:bg-white/5 transition-colors
                  "
                >
                  <Trash2 size={14} />
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <Upload className="text-zinc-400" size={32} />
                </div>
                <div>
                  <p className="text-lg font-medium text-zinc-300">
                    Drop your CSV file here
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    or click to browse your files
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Period Selection */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-sm text-zinc-300">
                Auto-detect period from filename (e.g., "LITTO - April '25")
              </span>
            </label>

            {!autoDetect && (
              <div className="flex gap-4 p-4 rounded-xl bg-white/2 border border-white/5">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="
                      w-full px-3 py-2.5 rounded-lg
                      bg-white/5 border border-white/1
                      text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    "
                  >
                    {MONTHS.map((m) => (
                      <option
                        key={m.value}
                        value={m.value}
                        className="bg-zinc-900"
                      >
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="
                      w-full px-3 py-2.5 rounded-lg
                      bg-white/5 border border-white/1
                      text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    "
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y} className="bg-zinc-900">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!file || isPending}
            className="
              w-full px-6 py-3.5 rounded-xl
              bg-linear-to-r from-blue-600 to-blue-500
              hover:from-blue-500 hover:to-blue-400
              text-white font-semibold
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              shadow-lg shadow-blue-500/25
            "
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Importing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Import Data
              </>
            )}
          </button>
        </>
      )}

      {/* Format Help */}
      <div className="p-4 rounded-xl bg-white/2 border border-white/5">
        <p className="text-xs font-medium text-zinc-400 mb-3">
          Expected CSV format:
        </p>
        <div className="space-y-2">
          <code className="block text-xs text-zinc-500 font-mono bg-white/3 p-2 rounded-lg overflow-x-auto">
            LITTO - April '25
          </code>
          <code className="block text-xs text-zinc-500 font-mono bg-white/3 p-2 rounded-lg overflow-x-auto">
            Platform, Impressions, Clicks, CTR %, Video Views, Video View Rate,
            Cost
          </code>
          <code className="block text-xs text-zinc-500 font-mono bg-white/3 p-2 rounded-lg overflow-x-auto">
            Meta Ads, 85452, 3428, 5.38%, -, -, $618.92
          </code>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============

export default function ImportPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Import Data</h1>
        <p className="text-zinc-500 mt-1">
          Upload CSV files to import ad analytics data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Form */}
        <GlassCard className="p-6">
          <SectionHeader
            icon={<Upload className="text-blue-400" size={20} />}
            title="Upload CSV"
            subtitle="Drag & drop or click to upload"
          />
          <ImportForm />
        </GlassCard>

        {/* Import History */}
        <GlassCard className="p-6">
          <SectionHeader
            icon={<TrendingUp className="text-emerald-400" size={20} />}
            title="Imported Data"
            subtitle="Previously imported periods"
            iconBg="from-emerald-500/20 to-teal-500/20"
          />
          <ImportHistory />
        </GlassCard>
      </div>
    </div>
  );
}
