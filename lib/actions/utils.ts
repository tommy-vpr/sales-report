// lib/actions/utils.ts
import { z } from "zod";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function createAction<TInput, TOutput>(config: {
  schema: z.ZodSchema<TInput>;
  handler: (input: TInput) => Promise<TOutput>;
}) {
  return async (input: unknown): Promise<ActionResult<TOutput>> => {
    const parsed = config.schema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        fieldErrors[field] ??= [];
        fieldErrors[field].push(issue.message);
      }
      return {
        success: false,
        error: "Validation failed",
        fieldErrors,
      };
    }

    try {
      const data = await config.handler(parsed.data);
      return { success: true, data };
    } catch (err) {
      console.error("Action error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Something went wrong",
      };
    }
  };
}
