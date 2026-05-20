import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getFormById, getUserPlan } from "@/lib/actions/form-actions";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDeleteButton } from "@/components/forms/form-delete-button";
import { QRCodesTab } from "@/components/forms/qr-codes-tab";
import { FormStats } from "@/components/dashboard/form-stats";
import { RefreshOnFocus } from "@/components/dashboard/refresh-on-focus";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  ACTIVE: "bg-green-100 text-green-700 hover:bg-green-100",
  ARCHIVED: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

interface FormDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function FormDetailPage({ params, searchParams }: FormDetailPageProps) {
  const { id } = await params;
  const { period: periodParam } = await searchParams;
  const period = [7, 30, 90].includes(Number(periodParam)) ? Number(periodParam) : 30;

  const t = await getTranslations("forms");
  const tCommon = await getTranslations("common");
  const [form, plan] = await Promise.all([getFormById(id), getUserPlan()]);

  if (!form) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <RefreshOnFocus />
      <div className="mb-6">
        <div className="flex items-start gap-2 sm:items-center sm:gap-3 sm:justify-between">
          <div className="flex items-start gap-2 sm:items-center sm:gap-3 min-w-0 flex-1">
            <Link
              href="/dashboard/forms"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-1 sm:mt-0"
            >
              &larr;
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold break-words min-w-0 flex-1">
              {form.title}
            </h1>
            <Badge
              className={`${statusColor[form.status]} shrink-0 hidden sm:inline-flex`}
              variant="secondary"
            >
              {t(
                `status.${form.status.toLowerCase()}` as
                  | "status.draft"
                  | "status.active"
                  | "status.archived"
              )}
            </Badge>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="sm:h-10 sm:px-4">
              <Link href={`/dashboard/forms/${id}/edit`}>{tCommon("edit")}</Link>
            </Button>
            <FormDeleteButton formId={id} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
          <Badge className={`${statusColor[form.status]} shrink-0`} variant="secondary">
            {t(
              `status.${form.status.toLowerCase()}` as
                | "status.draft"
                | "status.active"
                | "status.archived"
            )}
          </Badge>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/forms/${id}/edit`}>{tCommon("edit")}</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2"
                  aria-label={tCommon("moreActions")}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <FormDeleteButton formId={id} variant="menuitem" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">{t("detail.stats")}</TabsTrigger>
          <TabsTrigger value="qrcodes">{t("detail.qrcodes")}</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <FormStats userId={user.id} formId={id} period={period} />
        </TabsContent>
        <TabsContent value="qrcodes" className="mt-6">
          <QRCodesTab formId={id} formTitle={form.title} userPlan={plan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
