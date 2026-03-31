import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUrl } from "@/lib/domains";

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

  return <>{children}</>;
}
