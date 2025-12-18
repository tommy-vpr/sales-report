// lib/actions/monthly-summary.ts
"use server";

import { createAction } from "./utils";
import { MonthlySummaryFiltersSchema } from "@/lib/schemas/monthly-summary";
import { monthlySummaryService } from "../services/monthly-summary.service";

export const getMonthlySummary = createAction({
  schema: MonthlySummaryFiltersSchema,
  handler: (filters) => monthlySummaryService.getMonthlySummary(filters),
});
