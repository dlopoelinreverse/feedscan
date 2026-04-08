import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getFormById, getUserPlan } from "@/lib/actions/form-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDeleteButton } from "@/components/forms/form-delete-button";
import { QRCodesTab } from "@/components/forms/qr-codes-tab";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  ACTIVE: "bg-green-100 text-green-700 hover:bg-green-100",
  ARCHIVED: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

interface FormDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormDetailPage({ params }: FormDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("forms");
  const tCommon = await getTranslations("common");
  const [form, plan] = await Promise.all([getFormById(id), getUserPlan()]);

  if (!form) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/forms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr;
          </Link>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          <Badge
            className={statusColor[form.status]}
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
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/forms/${id}/edit`}>{tCommon("edit")}</Link>
          </Button>
          <FormDeleteButton formId={id} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">{t("detail.stats")}</TabsTrigger>
          <TabsTrigger value="qrcodes">{t("detail.qrcodes")}</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            &#128202; {t("detail.statsPlaceholder")}
          </div>
        </TabsContent>
        <TabsContent value="qrcodes" className="mt-6">
          <QRCodesTab formId={id} formTitle={form.title} userPlan={plan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
