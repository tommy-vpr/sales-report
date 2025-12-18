// hooks/use-import.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { importCSV, getReportPeriods } from "@/lib/actions/import";

export type {
  ImportResult,
  ReportPeriodsData,
  ReportPeriod,
} from "@/lib/schemas/import";

export function useImportCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      file: File;
      year?: number;
      month?: number;
    }) => {
      const fileContent = await input.file.text();

      const result = await importCSV({
        fileContent,
        fileName: input.file.name,
        year: input.year,
        month: input.month,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportPeriods"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
    },
  });
}

export function useReportPeriods() {
  return useQuery({
    queryKey: ["reportPeriods"],
    queryFn: async () => {
      const result = await getReportPeriods();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// // hooks/use-import.ts
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// // ============ TYPES ============

// export interface ImportResult {
//   success: boolean;
//   period: {
//     year: number;
//     month: number;
//     monthName: string;
//   };
//   records: {
//     created: number;
//     updated: number;
//     total: number;
//   };
//   summaries: {
//     platforms: string[];
//     count: number;
//   };
// }

// export interface ReportPeriod {
//   year: number;
//   month: number;
//   monthName: string;
//   label: string;
//   platforms: string[];
//   platformCount: number;
//   totalSpend: number;
//   totalImpressions: number;
//   campaignCount: number;
// }

// export interface PeriodsResponse {
//   periods: ReportPeriod[];
//   years: number[];
//   totalReports: number;
//   totals: {
//     totalSpend: number;
//     totalImpressions: number;
//     campaignCount: number;
//   };
// }

// // ============ IMPORT MUTATION ============

// interface ImportOptions {
//   file: File;
//   year?: number;
//   month?: number;
// }

// async function importCSV({
//   file,
//   year,
//   month,
// }: ImportOptions): Promise<ImportResult> {
//   const formData = new FormData();
//   formData.append("file", file);
//   if (year) formData.append("year", year.toString());
//   if (month) formData.append("month", month.toString());

//   const response = await fetch("/api/import", {
//     method: "POST",
//     body: formData,
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error || "Import failed");
//   }

//   return response.json();
// }

// export function useImportCSV() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: importCSV,
//     onSuccess: () => {
//       // Invalidate all sales report queries to refresh data
//       queryClient.invalidateQueries({ queryKey: ["salesReport"] });
//       queryClient.invalidateQueries({ queryKey: ["reportPeriods"] });
//     },
//   });
// }

// // ============ PERIODS QUERY ============

// async function fetchPeriods(): Promise<PeriodsResponse> {
//   const response = await fetch("/api/periods");

//   if (!response.ok) {
//     throw new Error("Failed to fetch periods");
//   }

//   return response.json();
// }

// export function useReportPeriods() {
//   return useQuery({
//     queryKey: ["reportPeriods"],
//     queryFn: fetchPeriods,
//     staleTime: 1000 * 60 * 5, // 5 minutes
//   });
// }
