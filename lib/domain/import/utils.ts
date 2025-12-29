export function parseNumber(value?: string | null): number | null {
  if (!value || value === "-" || value === "" || value === "0") return null;
  const cleaned = value.replace(/[$,%\s"]/g, "").replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function getRowValue(
  row: Record<string, string>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  return null;
}
