import { notFound } from "next/navigation";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getFormById } from "@/lib/actions/form-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormDeleteButton } from "@/components/forms/form-delete-button";
import { FormDetailTabsNav } from "@/components/forms/form-detail-tabs-nav";
import { RefreshOnFocus } from "@/components/dashboard/refresh-on-focus";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  ACTIVE: "bg-green-100 text-green-700 hover:bg-green-100",
  ARCHIVED: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

interface FormDetailLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function FormDetailLayout({
  children,
  params,
}: FormDetailLayoutProps) {
  const { id } = await params;

  const t = await getTranslations("forms");
  const tCommon = await getTranslations("common");
  const form = await getFormById(id);

  if (!form) notFound();

  const statusLabel = t(
    `status.${form.status.toLowerCase()}` as
      | "status.draft"
      | "status.active"
      | "status.archived"
  );

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
              {statusLabel}
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
            {statusLabel}
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

      <FormDetailTabsNav formId={id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
