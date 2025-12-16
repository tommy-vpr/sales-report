// app/dashboard/layout.tsx
import { Header } from "@/components/layout/Header";
import { requireAuth } from "@/lib/auth-helper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated
  await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main>{children}</main>
    </div>
  );
}
