// hooks/use-comparison.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getComparison } from "@/lib/actions/comparison";
import type { ComparisonParams } from "@/lib/schemas/comparison";

export type {
  ComparisonParams,
  ComparisonData,
  ComparisonChanges,
  PeriodData,
  PeriodTotals,
  PlatformComparison,
  PlatformPeriodData,
} from "@/lib/schemas/comparison";

export function useComparison(params: ComparisonParams | null) {
  return useQuery({
    queryKey: ["comparison", params],
    queryFn: () => getComparison(params!),
    enabled: !!params,
    staleTime: 1000 * 60 * 5,
  });
}
