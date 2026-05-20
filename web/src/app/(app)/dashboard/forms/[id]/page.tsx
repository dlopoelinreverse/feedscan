import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormStats } from "@/components/dashboard/form-stats";

interface FormDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function FormDetailPage({
  params,
  searchParams,
}: FormDetailPageProps) {
  const { id } = await params;
  const { period: periodParam } = await searchParams;
  const period = [7, 30, 90].includes(Number(periodParam))
    ? Number(periodParam)
    : 30;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <FormStats userId={user.id} formId={id} period={period} />;
}
