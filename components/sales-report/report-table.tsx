// components/sales-report/report-table.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useReport, useAvailableFilters } from "@/hooks/use-sales-report";
import type {
  Platform,
  GetReportInput,
  SortOptions,
  AvailableFilters,
  ReportRow,
} from "@/lib/schemas/sales-report";
import {
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Download,
} from "lucide-react";

// ============ PLATFORM COLORS ============

const platformColors: Record<string, { bg: string; text: string }> = {
  META: { bg: "bg-blue-500/20", text: "text-blue-400" },
  X: { bg: "bg-zinc-500/20", text: "text-zinc-300" },
  TIKTOK: { bg: "bg-pink-500/20", text: "text-pink-400" },
  LINKEDIN: { bg: "bg-sky-500/20", text: "text-sky-400" },
  TABOOLA: { bg: "bg-orange-500/20", text: "text-orange-400" },
  VIBE_CTV: { bg: "bg-purple-500/20", text: "text-purple-400" },
  WHOLESALE_CENTRAL: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
};

// ============ FORMAT HELPERS ============

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString();
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

// ============ FILTER CHIP ============

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
      <span className="text-blue-300/60">{label}:</span>
      {value}
      <button
        onClick={onRemove}
        className="ml-0.5 p-0.5 rounded-full hover:bg-blue-500/30 transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  );
}

// ============ FILTER PANEL ============

interface FilterPanelProps {
  filters: GetReportInput["filters"];
  onFiltersChange: (filters: GetReportInput["filters"]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function FilterPanel({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
}: FilterPanelProps) {
  const { data: availableFilters, isLoading } = useAvailableFilters();

  const { platforms = [], regions = [] } =
    (availableFilters as AvailableFilters) || {};

  const activeFilterCount = [
    filters?.platforms?.length,
    filters?.regions?.length,
    filters?.dateRange ? 1 : 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className={`
            inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
            border transition-all text-sm font-medium
            ${
              isOpen
                ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                : "bg-white/5 border-white/1 text-zinc-300 hover:bg-white/8"
            }
          `}
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Active Filters Chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters?.platforms?.map((p) => (
              <FilterChip
                key={p}
                label="Platform"
                value={p}
                onRemove={() => {
                  const newPlatforms = filters.platforms?.filter(
                    (x) => x !== p
                  );
                  onFiltersChange({
                    ...filters,
                    platforms: newPlatforms?.length ? newPlatforms : undefined,
                  });
                }}
              />
            ))}
            {filters?.regions?.map((r) => (
              <FilterChip
                key={r}
                label="Region"
                value={r}
                onRemove={() => {
                  const newRegions = filters.regions?.filter((x) => x !== r);
                  onFiltersChange({
                    ...filters,
                    regions: newRegions?.length ? newRegions : undefined,
                  });
                }}
              />
            ))}
            <button
              onClick={() => onFiltersChange(undefined)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Expandable Filter Options */}
      {isOpen && (
        <GlassCard className="p-5 animate-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 w-40 bg-white/5 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {/* Platform Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p: Platform) => {
                    const isSelected = filters?.platforms?.includes(p);
                    const colors = platformColors[p] || platformColors.META;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          const current = filters?.platforms || [];
                          const newPlatforms = isSelected
                            ? current.filter((x) => x !== p)
                            : [...current, p];
                          onFiltersChange({
                            ...filters,
                            platforms: newPlatforms.length
                              ? newPlatforms
                              : undefined,
                          });
                        }}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${
                            isSelected
                              ? `${colors.bg} ${colors.text} ring-1 ring-current`
                              : "bg-white/5 text-zinc-400 hover:bg-white/8"
                          }
                        `}
                      >
                        {p.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Region Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Region
                </label>
                <select
                  multiple
                  value={filters?.regions || []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    );
                    onFiltersChange({
                      ...filters,
                      regions: selected.length ? selected : undefined,
                    });
                  }}
                  className="
                    w-48 h-28 rounded-lg px-3 py-2
                    bg-white/5 border border-white/1
                    text-sm text-zinc-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  "
                >
                  {regions.map((r: string) => (
                    <option key={r} value={r} className="bg-zinc-900 py-1">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                      size={14}
                    />
                    <input
                      type="date"
                      value={
                        filters?.dateRange?.startDate
                          ?.toISOString()
                          .split("T")[0] ?? ""
                      }
                      onChange={(e) => {
                        onFiltersChange({
                          ...filters,
                          dateRange: {
                            startDate: new Date(e.target.value),
                            endDate: filters?.dateRange?.endDate ?? new Date(),
                          },
                        });
                      }}
                      className="
                        pl-9 pr-3 py-2 rounded-lg w-36
                        bg-white/5 border border-white/1
                        text-sm text-zinc-300
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                      "
                    />
                  </div>
                  <span className="text-zinc-600">→</span>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                      size={14}
                    />
                    <input
                      type="date"
                      value={
                        filters?.dateRange?.endDate
                          ?.toISOString()
                          .split("T")[0] ?? ""
                      }
                      onChange={(e) => {
                        onFiltersChange({
                          ...filters,
                          dateRange: {
                            startDate:
                              filters?.dateRange?.startDate ??
                              new Date("2025-04-01"),
                            endDate: new Date(e.target.value),
                          },
                        });
                      }}
                      className="
                        pl-9 pr-3 py-2 rounded-lg w-36
                        bg-white/5 border border-white/1
                        text-sm text-zinc-300
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

// ============ SORTABLE HEADER ============

interface SortableHeaderProps {
  field: SortOptions["field"];
  label: string;
  currentSort?: SortOptions;
  onSort: (field: SortOptions["field"]) => void;
  align?: "left" | "right";
}

function SortableHeader({
  field,
  label,
  currentSort,
  onSort,
  align = "right",
}: SortableHeaderProps) {
  const isActive = currentSort?.field === field;
  const isAsc = isActive && currentSort?.order === "asc";
  const isDesc = isActive && currentSort?.order === "desc";

  return (
    <th
      className={`
        px-5 py-4 text-xs font-semibold uppercase tracking-wider cursor-pointer
        select-none transition-colors hover:bg-white/3
        ${align === "right" ? "text-right" : "text-left"}
        ${isActive ? "text-blue-400" : "text-zinc-500"}
      `}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-zinc-600">
          {isActive ? (
            isAsc ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )
          ) : (
            <ChevronsUpDown size={14} />
          )}
        </span>
      </span>
    </th>
  );
}

// ============ PAGINATION ============

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

function Pagination({
  page,
  totalPages,
  total,
  hasMore,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-white/6">
      <span className="text-sm text-zinc-500">
        Page <span className="text-zinc-300 font-medium">{page}</span> of{" "}
        <span className="text-zinc-300 font-medium">{totalPages}</span>
        <span className="mx-2 text-zinc-700">•</span>
        <span className="text-zinc-300 font-medium">
          {total.toLocaleString()}
        </span>{" "}
        records
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="flex items-center p-2 rounded-lg text-zinc-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          <ChevronLeft size={16} className="-ml-2" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg text-zinc-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  w-8 h-8 rounded-lg text-sm font-medium transition-all
                  ${
                    pageNum === page
                      ? "bg-blue-500 text-white"
                      : "text-zinc-400 hover:bg-white/5"
                  }
                `}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore}
          className="p-2 rounded-lg text-zinc-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasMore}
          className="flex items-center p-2 rounded-lg text-zinc-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
          <ChevronRight size={16} className="-ml-2" />
        </button>
      </div>
    </div>
  );
}

// ============ MAIN REPORT TABLE ============

export function ReportTable() {
  const [filters, setFilters] = useState<GetReportInput["filters"]>();
  const [sort, setSort] = useState<SortOptions>({
    field: "reportDate",
    order: "desc",
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 15;

  const input: GetReportInput = useMemo(
    () => ({
      filters,
      sort,
      pagination: { page, limit },
      aggregation: "daily",
    }),
    [filters, sort, page]
  );

  const { data, isLoading, isFetching } = useReport(input);

  const handleSort = useCallback((field: SortOptions["field"]) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: GetReportInput["filters"]) => {
      setFilters(newFilters);
      setPage(1);
    },
    []
  );

  const report = data?.success ? data.data : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Campaign Report</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Detailed view of all campaign metrics
          </p>
        </div>
        <button
          className="
            inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-white/5 border border-white/1
            text-sm font-medium text-zinc-300
            hover:bg-white/8 transition-colors
          "
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/6 bg-white/2">
                <th className="px-5 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Region
                </th>
                <SortableHeader
                  field="impressions"
                  label="Impressions"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="clicks"
                  label="Clicks"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="spend"
                  label="Spend"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="ctr"
                  label="CTR"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="cpm"
                  label="CPM"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="roas"
                  label="ROAS"
                  currentSort={sort}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-50" : ""}>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-white/4">
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : report?.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="text-zinc-600" size={40} />
                      <p className="text-zinc-500">
                        No data found for the selected filters
                      </p>
                      <button
                        onClick={() => handleFiltersChange(undefined)}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                report?.items.map((row: ReportRow, i: number) => {
                  const colors =
                    platformColors[row.campaign?.platform || "META"] ||
                    platformColors.META;
                  return (
                    <tr
                      key={row.id ?? i}
                      className="border-b border-white/4 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm text-zinc-400">
                        {new Date(row.reportDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-white">
                          {row.campaign?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${colors.bg} ${colors.text}`}
                        >
                          {row.campaign?.platform?.replace("_", " ") ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-400">
                        {row.region ?? "All"}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-300 text-right font-mono">
                        {formatNumber(row.impressions)}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-300 text-right font-mono">
                        {formatNumber(row.clicks)}
                      </td>
                      <td className="px-5 py-4 text-sm text-white text-right font-semibold font-mono">
                        {formatCurrency(row.spend)}
                      </td>
                      <td className="px-5 py-4 text-sm text-right font-mono">
                        <span
                          className={
                            row.ctr && row.ctr > 0.02
                              ? "text-emerald-400"
                              : "text-zinc-400"
                          }
                        >
                          {row.ctr ? `${(row.ctr * 100).toFixed(2)}%` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-300 text-right font-mono">
                        {row.cpm ? formatCurrency(row.cpm) : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-right font-mono">
                        {row.roas ? (
                          <span
                            className={`font-semibold ${
                              row.roas > 1
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {row.roas.toFixed(2)}x
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {report && (
          <Pagination
            page={report.pagination.page}
            totalPages={report.pagination.totalPages}
            total={report.pagination.total}
            hasMore={report.pagination.hasMore}
            onPageChange={setPage}
          />
        )}
      </GlassCard>
    </div>
  );
}
