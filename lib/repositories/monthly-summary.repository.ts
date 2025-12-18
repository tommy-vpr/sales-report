// lib/repositories/monthly-summary.repository.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { Platform } from "@/lib/schemas/sales-report";

export interface MonthlySummaryFilters {
  year?: number;
  month?: number;
  platform?: Platform; // Changed from string
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}

function buildWhereClause(
  filters: MonthlySummaryFilters
): Prisma.MonthlySummaryWhereInput {
  const where: Prisma.MonthlySummaryWhereInput = {};

  if (
    filters.startYear &&
    filters.startMonth &&
    filters.endYear &&
    filters.endMonth
  ) {
    const startDate = new Date(filters.startYear, filters.startMonth - 1, 1);
    const endDate = new Date(filters.endYear, filters.endMonth, 0);
    where.month = { gte: startDate, lte: endDate };
  } else if (filters.year && filters.month) {
    where.month = new Date(filters.year, filters.month - 1, 1);
  } else if (filters.year) {
    where.month = {
      gte: new Date(filters.year, 0, 1),
      lte: new Date(filters.year, 11, 31),
    };
  }

  if (filters.platform) {
    where.platform = filters.platform;
  }

  return where;
}

export const monthlySummaryRepository = {
  findMany(filters: MonthlySummaryFilters) {
    return prisma.monthlySummary.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ month: "desc" }, { platform: "asc" }],
    });
  },
};
