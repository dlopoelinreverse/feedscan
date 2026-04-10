import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsView } from "@/components/dashboard/analytics-view";

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { period: periodParam } = await searchParams;
  const period = [7, 30, 90].includes(Number(periodParam)) ? Number(periodParam) : 30;

  return (
    <div className="p-6">
      <AnalyticsView userId={user.id} period={period} title="Dashboard" />
    </div>
  );
}
