// lib/actions/import.ts
"use server";

import { createAction } from "./utils";
import { ImportCSVInputSchema } from "@/lib/schemas/import";
import { importService } from "@/lib/services/import.service";

export const importCSV = createAction({
  schema: ImportCSVInputSchema,
  handler: (input) => importService.importCSV(input),
});

export async function getReportPeriods() {
  try {
    const data = await importService.getReportPeriods();
    return { success: true as const, data };
  } catch (err) {
    console.error("getReportPeriods error:", err);
    return {
      success: false as const,
      error:
        err instanceof Error ? err.message : "Failed to fetch report periods",
    };
  }
}
