// lib/repositories/comparison.repository.ts
import { prisma } from "@/lib/prisma";

export const comparisonRepository = {
  findMonthlySummariesByMonth(month: Date) {
    return prisma.monthlySummary.findMany({
      where: { month },
      orderBy: { totalSpend: "desc" },
    });
  },
};
