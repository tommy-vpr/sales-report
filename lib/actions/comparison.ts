// lib/actions/comparison.ts
"use server";

import { createAction } from "./utils";
import { ComparisonParamsSchema } from "@/lib/schemas/comparison";
import { comparisonService } from "@/lib/services/comparison.service";

export const getComparison = createAction({
  schema: ComparisonParamsSchema,
  handler: (params) => comparisonService.getComparison(params),
});
