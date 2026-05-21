import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getRemainingResponses } from "@/lib/plan-limits";
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { FreePlanBanner } from "@/components/dashboard/free-plan-banner";
import { RefreshOnFocus } from "@/components/dashboard/refresh-on-focus";

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { period: periodParam } = await searchParams;
  const period = [7, 30, 90].includes(Number(periodParam)) ? Number(periodParam) : 30;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, plan: true, aiGenerationsUsed: true },
  });

  const showBanner = dbUser?.plan === "FREE";
  let responseUsage = { used: 0, limit: 50 };
  if (showBanner && dbUser) {
    const remaining = await getRemainingResponses(dbUser);
    responseUsage = { used: remaining.used, limit: remaining.limit ?? 50 };
  }

  return (
    <div className="p-4 sm:p-6">
      <RefreshOnFocus />
      {showBanner && (
        <FreePlanBanner used={responseUsage.used} limit={responseUsage.limit} />
      )}
      <AnalyticsView userId={user.id} period={period} title={t("title")} />
    </div>
  );
}
