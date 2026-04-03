import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getFormById, deleteForm } from "@/lib/actions/form-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDeleteButton } from "@/components/forms/form-delete-button";

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
  const form = await getFormById(id);

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
            <Link href={`/dashboard/forms/${id}/edit`}>
              {t("common.edit" as never) || "Modifier"}
            </Link>
          </Button>
          <FormDeleteButton formId={id} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            &#128202; Les statistiques arrivent bient&ocirc;t
          </div>
        </TabsContent>
        <TabsContent value="qrcodes">
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            &#128241; Les QR codes arrivent bient&ocirc;t
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
