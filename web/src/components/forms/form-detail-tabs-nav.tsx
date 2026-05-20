"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface FormDetailTabsNavProps {
  formId: string;
}

export function FormDetailTabsNav({ formId }: FormDetailTabsNavProps) {
  const t = useTranslations("forms");
  const pathname = usePathname();

  const tabs = [
    { href: `/dashboard/forms/${formId}`, label: t("detail.stats") },
    {
      href: `/dashboard/forms/${formId}/qr-codes`,
      label: t("detail.qrcodes"),
    },
  ];

  return (
    <div
      role="tablist"
      className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground max-w-full overflow-x-auto"
    >
      {tabs.map((tab) => {
        const active =
          tab.href === `/dashboard/forms/${formId}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            prefetch
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
