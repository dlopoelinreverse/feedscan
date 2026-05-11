import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getUserForms, getUserPlan } from "@/lib/actions/form-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  ACTIVE: "bg-green-100 text-green-700 hover:bg-green-100",
  ARCHIVED: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

export default async function FormsListPage() {
  const t = await getTranslations("forms");
  const [forms, plan] = await Promise.all([getUserForms(), getUserPlan()]);

  const canCreate = plan !== "FREE" || forms.length < 1;

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("manageForms")}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                {canCreate ? (
                  <Button asChild size="sm" className="sm:h-10 sm:px-4">
                    <Link href="/dashboard/forms/new">{t("createNew")}</Link>
                  </Button>
                ) : (
                  <Button disabled size="sm" className="sm:h-10 sm:px-4">{t("createNew")}</Button>
                )}
              </span>
            </TooltipTrigger>
            {!canCreate && (
              <TooltipContent>
                <p>
                  {t("planLimit")}{" "}
                  <Link
                    href="/dashboard/settings"
                    className="underline text-primary"
                  >
                    &rarr;
                  </Link>
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="h-12 w-12 text-muted-foreground/50 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
            <p className="text-muted-foreground mb-4">{t("emptyState")}</p>
            <Button asChild>
              <Link href="/dashboard/forms/new">{t("createNew")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((form: { id: string; title: string; status: string; createdAt: Date; _count: { responses: number } }) => (
            <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer mb-3">
                <CardContent className="flex items-center justify-between gap-3 py-4 px-4 sm:px-5">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold truncate">{form.title}</span>
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
                    <p className="text-sm text-muted-foreground truncate">
                      {t("responses", { count: form._count.responses })}{" "}
                      &middot;{" "}
                      {t("createdAt", {
                        date: new Date(form.createdAt).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 text-muted-foreground shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
