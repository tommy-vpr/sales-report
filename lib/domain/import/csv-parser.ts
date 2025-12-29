// lib/domain/import/csv-parser.ts
import { PLATFORM_MAP } from "./platform-map";

export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(Boolean);

  const headerIndex = lines.findIndex(
    (l) => l.includes("Platform") && l.includes("Impressions")
  );

  if (headerIndex === -1) {
    throw new Error("CSV header row not found");
  }

  const headers = lines[headerIndex].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith("TOTAL")) break;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else current += char;
    }
    values.push(current);

    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));

    if (PLATFORM_MAP[row.Platform]) {
      rows.push(row);
    }
  }

  return rows;
}
