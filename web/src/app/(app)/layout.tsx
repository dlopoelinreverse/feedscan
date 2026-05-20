import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUrl } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/dashboard/app-shell";
import { DemoBanner } from "@/components/dashboard/demo-banner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getAuthUrl("/login"));
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true, isDemo: true, expiresAt: true },
  });
  const plan: string = dbUser?.plan ?? "FREE";

  return (
    <AppShell
      userEmail={user.email ?? ""}
      plan={plan}
    >
      {dbUser?.isDemo && dbUser.expiresAt && (
        <DemoBanner expiresAt={dbUser.expiresAt} />
      )}
      {children}
    </AppShell>
  );
}
