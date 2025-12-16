// components/sales-report/period-filter.tsx
"use client";

import { useState, useMemo } from "react";
import { useReportPeriods } from "@/hooks/use-import";
import type { DateRange } from "@/lib/schemas/sales-report";
import {
  Calendar,
  ChevronDown,
  Check,
  Loader2,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

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
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.08]
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ============ TYPES ============

type FilterMode = "preset" | "month" | "range" | "custom";

interface PeriodFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// ============ PRESET OPTIONS ============

const PRESETS = [
  {
    id: "all",
    label: "All Time",
    getRange: () => ({
      startDate: new Date("2025-01-01"),
      endDate: new Date(),
    }),
  },
  {
    id: "ytd",
    label: "Year to Date",
    getRange: () => {
      const now = new Date();
      return { startDate: new Date(now.getFullYear(), 0, 1), endDate: now };
    },
  },
  {
    id: "q1",
    label: "Q1",
    getRange: (year: number) => ({
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 2, 31),
    }),
  },
  {
    id: "q2",
    label: "Q2",
    getRange: (year: number) => ({
      startDate: new Date(year, 3, 1),
      endDate: new Date(year, 5, 30),
    }),
  },
  {
    id: "q3",
    label: "Q3",
    getRange: (year: number) => ({
      startDate: new Date(year, 6, 1),
      endDate: new Date(year, 8, 30),
    }),
  },
  {
    id: "q4",
    label: "Q4",
    getRange: (year: number) => ({
      startDate: new Date(year, 9, 1),
      endDate: new Date(year, 11, 31),
    }),
  },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ============ PERIOD FILTER COMPONENT ============

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FilterMode>("preset");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: periodsData, isLoading } = useReportPeriods();

  // Get available years and months from imported data
  const availableYears = periodsData?.years || [new Date().getFullYear()];
  const availableMonths = useMemo(() => {
    if (!periodsData?.periods) return [];
    return periodsData.periods.filter((p) => p.year === selectedYear);
  }, [periodsData, selectedYear]);

  // Format current selection for display
  const displayValue = useMemo(() => {
    const start = value.startDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const end = value.endDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (start === end) return start;
    return `${start} - ${end}`;
  }, [value]);

  const handleMonthSelect = (year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const range = preset.getRange(selectedYear);
      onChange(range);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-xl
          bg-white/[0.05] border border-white/[0.1]
          text-white font-medium text-sm
          cursor-pointer transition-all
          hover:bg-white/[0.08] hover:border-white/[0.15]
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
        "
      >
        <Calendar size={16} className="text-zinc-400" />
        <span>{displayValue}</span>
        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Separate absolute wrapper */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80">
            {/* Dropdown Content */}
            <GlassCard className="absolute right-0 top-full mt-2 z-50 w-80 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-zinc-400" size={24} />
                </div>
              ) : (
                <>
                  {/* Mode Tabs */}
                  <div className="flex gap-1 mb-4 p-1 rounded-lg bg-white/[0.03]">
                    {[
                      { id: "preset", label: "Presets", icon: CalendarDays },
                      { id: "month", label: "By Month", icon: Calendar },
                      { id: "range", label: "Range", icon: CalendarRange },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setMode(id as FilterMode)}
                        className={`
                        flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md
                        text-xs font-medium transition-all
                        ${
                          mode === id
                            ? "bg-blue-500 text-white"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                        }
                      `}
                      >
                        <Icon size={14} />
                        <span className="whitespace-nowrap">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Presets Mode */}
                  {mode === "preset" && (
                    <div className="space-y-4">
                      {/* Year Selector for Quarters */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Year:</span>
                        <div className="flex gap-1">
                          {availableYears.map((year) => (
                            <button
                              key={year}
                              onClick={() => setSelectedYear(year)}
                              className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                              ${
                                selectedYear === year
                                  ? "bg-blue-500 text-white"
                                  : "bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08]"
                              }
                            `}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preset Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset.id)}
                            className="
                            px-3 py-2.5 rounded-lg text-sm font-medium
                            bg-white/[0.03] text-zinc-300
                            hover:bg-white/[0.06] hover:text-white
                            transition-all text-left
                          "
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Month Mode */}
                  {mode === "month" && (
                    <div className="space-y-4">
                      {/* Year Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Year:</span>
                        <div className="flex gap-1">
                          {availableYears.map((year) => (
                            <button
                              key={year}
                              onClick={() => setSelectedYear(year)}
                              className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                              ${
                                selectedYear === year
                                  ? "bg-blue-500 text-white"
                                  : "bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08]"
                              }
                            `}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Month Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {MONTHS.map((month, idx) => {
                          const monthNum = idx + 1;
                          const isAvailable = availableMonths.some(
                            (m) => m.month === monthNum
                          );
                          const isSelected =
                            value.startDate.getFullYear() === selectedYear &&
                            value.startDate.getMonth() === idx &&
                            value.endDate.getMonth() === idx;

                          return (
                            <button
                              key={month}
                              onClick={() =>
                                isAvailable &&
                                handleMonthSelect(selectedYear, monthNum)
                              }
                              disabled={!isAvailable}
                              className={`
                              relative px-2 py-2.5 rounded-lg text-xs font-medium transition-all
                              ${
                                isSelected
                                  ? "bg-blue-500 text-white"
                                  : isAvailable
                                  ? "bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
                                  : "bg-transparent text-zinc-600 cursor-not-allowed"
                              }
                            `}
                            >
                              {month.slice(0, 3)}
                              {isAvailable && !isSelected && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                              {isSelected && (
                                <Check
                                  size={12}
                                  className="absolute top-1 right-1"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {availableMonths.length === 0 && (
                        <p className="text-xs text-zinc-500 text-center py-2">
                          No reports imported for {selectedYear}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Range Mode */}
                  {mode === "range" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            From
                          </label>
                          <input
                            type="date"
                            value={value.startDate.toISOString().split("T")[0]}
                            onChange={(e) => {
                              onChange({
                                ...value,
                                startDate: new Date(e.target.value),
                              });
                            }}
                            className="
                            w-full px-3 py-2.5 rounded-lg
                            bg-white/[0.05] border border-white/[0.1]
                            text-white text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50
                          "
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            To
                          </label>
                          <input
                            type="date"
                            value={value.endDate.toISOString().split("T")[0]}
                            onChange={(e) => {
                              onChange({
                                ...value,
                                endDate: new Date(e.target.value),
                              });
                            }}
                            className="
                            w-full px-3 py-2.5 rounded-lg
                            bg-white/[0.05] border border-white/[0.1]
                            text-white text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50
                          "
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setIsOpen(false)}
                        className="
                        w-full px-4 py-2.5 rounded-lg
                        bg-blue-500 text-white text-sm font-medium
                        hover:bg-blue-600 transition-colors
                      "
                      >
                        Apply Range
                      </button>
                    </div>
                  )}

                  {/* Available Reports Info */}
                  {periodsData && periodsData.totalReports > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <p className="text-xs text-zinc-500">
                        {periodsData.totalReports} reports available across{" "}
                        {periodsData.periods.length} months
                      </p>
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}

// ============ SIMPLE YEAR/MONTH SELECTORS ============

interface YearMonthFilterProps {
  year: number;
  month: number | null;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number | null) => void;
}

export function YearMonthFilter({
  year,
  month,
  onYearChange,
  onMonthChange,
}: YearMonthFilterProps) {
  const { data: periodsData, isLoading } = useReportPeriods();

  const availableYears = periodsData?.years || [new Date().getFullYear()];
  const availableMonths = useMemo(() => {
    if (!periodsData?.periods) return [];
    return periodsData.periods.filter((p) => p.year === year);
  }, [periodsData, year]);

  return (
    <div className="flex items-center gap-3">
      {/* Year Selector */}
      <div className="relative">
        <select
          value={year}
          onChange={(e) => {
            onYearChange(parseInt(e.target.value));
            onMonthChange(null); // Reset month when year changes
          }}
          disabled={isLoading}
          className="
            appearance-none pl-4 pr-10 py-2.5 rounded-xl
            bg-white/[0.05] border border-white/[0.1]
            text-white font-medium text-sm
            cursor-pointer transition-all
            hover:bg-white/[0.08] hover:border-white/[0.15]
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            disabled:opacity-50
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

      {/* Month Selector */}
      <div className="relative">
        <select
          value={month ?? "all"}
          onChange={(e) => {
            const val = e.target.value;
            onMonthChange(val === "all" ? null : parseInt(val));
          }}
          disabled={isLoading}
          className="
            appearance-none pl-4 pr-10 py-2.5 rounded-xl
            bg-white/[0.05] border border-white/[0.1]
            text-white font-medium text-sm
            cursor-pointer transition-all
            hover:bg-white/[0.08] hover:border-white/[0.15]
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            disabled:opacity-50
          "
        >
          <option value="all" className="bg-zinc-900">
            All Months
          </option>
          {availableMonths.map((m) => (
            <option key={m.month} value={m.month} className="bg-zinc-900">
              {m.monthName} ({m.campaignCount})
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          size={16}
        />
      </div>
    </div>
  );
}
