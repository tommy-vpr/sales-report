// components/sales-report/import-csv.tsx
"use client";

import { useState, useCallback } from "react";
import { useImportCSV } from "@/hooks/use-import";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  Loader2,
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
      className={`relative overflow-hidden rounded-2xl 
        bg-white/3 backdrop-blur-xl
        border border-white/8
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        ${className}`}
    >
      {children}
    </div>
  );
}

// ============ IMPORT MODAL ============

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
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

  const handleClose = () => {
    setFile(null);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <GlassCard className="relative z-10 w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-500/20">
              <Upload className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Import Report
              </h2>
              <p className="text-sm text-zinc-500">
                Upload a CSV file to import data
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-zinc-400 hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success State */}
        {isSuccess && data && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-emerald-500/20">
                <Check className="text-emerald-400" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Import Successful!
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  <span className="font-semibold text-white">
                    {data.period.monthName} {data.period.year}
                  </span>
                  {" — "}
                  {data.records.created} created, {data.records.updated} updated
                </p>
                {data.summaries && data.summaries.count > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Monthly summaries updated for:{" "}
                    {data.summaries.platforms.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-rose-500/20">
                <AlertCircle className="text-rose-400" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-400">
                  Import Failed
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-xl border-2 border-dashed p-8 text-center transition-all
            ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-white/10 hover:border-white/20 hover:bg-white/2"
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
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <FileSpreadsheet className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  reset();
                }}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-xl bg-white/5">
                <Upload className="text-zinc-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">
                  Drop your CSV file here
                </p>
                <p className="text-xs text-zinc-500 mt-1">or click to browse</p>
              </div>
            </div>
          )}
        </div>

        {/* Period Selection */}
        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDetect}
              onChange={(e) => setAutoDetect(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
            />
            <span className="text-sm text-zinc-300">
              Auto-detect period from filename
            </span>
          </label>

          {!autoDetect && (
            <div className="flex gap-4">
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

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="
              flex-1 px-4 py-2.5 rounded-xl
              bg-white/5 border border-white/1
              text-sm font-medium text-zinc-300
              hover:bg-white/8 transition-colors
            "
          >
            {isSuccess ? "Close" : "Cancel"}
          </button>
          {!isSuccess && (
            <button
              onClick={handleImport}
              disabled={!file || isPending}
              className="
                flex-1 px-4 py-2.5 rounded-xl
                bg-blue-500 text-white
                text-sm font-medium
                hover:bg-blue-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Import
                </>
              )}
            </button>
          )}
        </div>

        {/* Format Help */}
        <div className="mt-6 p-4 rounded-xl bg-white/2 border border-white/5">
          <p className="text-xs font-medium text-zinc-400 mb-2">
            Expected CSV format:
          </p>
          <code className="text-xs text-zinc-500 font-mono">
            Platform, Impressions, Clicks, CTR %, Video Views, Cost
          </code>
        </div>
      </GlassCard>
    </div>
  );
}

// ============ IMPORT BUTTON ============

export function ImportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="
          inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-blue-500
          text-sm font-medium text-white
          hover:from-blue-600 hover:to-purple-600
          transition-all shadow-lg shadow-blue-500/25 cursor-pointer
        "
      >
        <Upload size={16} />
        Import CSV
      </button>

      <ImportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
