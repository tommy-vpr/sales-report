// app/dashboard/page.tsx
import { SalesReportDashboard } from "@/components/sales-report/dashboard-overview";
import { MonthlyDashboard } from "@/components/sales-report/monthly-dashboard";
import { ReportTable } from "@/components/sales-report/report-table";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Dashboard Section */}
      {/* <SalesReportDashboard /> */}

      {/* Monthly Section */}
      <MonthlyDashboard />

      {/* Report Table Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        <ReportTable />
      </div>
    </div>
  );
}
