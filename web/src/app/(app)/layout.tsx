import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUrl } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/dashboard/app-shell";

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

  // Fetch plan from Prisma
  let plan: string = "FREE";
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    if (dbUser) plan = dbUser.plan;
  } catch {
    // Prisma not connected yet — ignore
  }

  return (
    <AppShell
      userEmail={user.email ?? ""}
      plan={plan}
    >
      {children}
    </AppShell>
  );
}
