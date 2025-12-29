// lib/domain/import/period-extractor.ts
import type { ImportPeriod } from "./types";

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export function extractPeriod(content: string, filename: string): ImportPeriod {
  const text = `${content} ${filename}`.toLowerCase();

  for (const [name, month] of Object.entries(MONTHS)) {
    if (text.includes(name)) {
      const yearMatch = text.match(/\b(20\d{2})\b/);
      const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      return { year, month };
    }
  }

  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
